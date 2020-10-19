const crypto = require('crypto');
const moment = require('moment');
const nou = require('nou');
const BasicModule = require('./basic-module.js');
const GenericError = require('../errors/generic-error.js');
const ItemNotFoundError = require('../errors/item-not-found-error.js');
const PasswordPolicyError = require('../errors/password-policy-error.js');
const SchemaValidationError = require('../errors/schema-validation-error.js');
const ItemExistsError = require('../errors/item-exists-error.js');
const LRU = require("lru-cache");

class Auth extends BasicModule {

    constructor(config, services) {
        super("auth", config, services)

        this.init({
            saltLength: 20,
            keyIterations: 100000,
            keyLength: 128,
            digest: "sha512",
            preRegisterTokenLength: 20,
            url: "http://localhost:8080/api/identity/verify",
            expiration: 7776000000,
            secure: false
        })

        this.cache = new LRU({
            max: 500,
            length: function(n, key) {
                return n.length + key.length
            }
        })
    }

    saltAndPbkdf(password, callback) {
        var salt = [];
        var self = this;
        crypto.randomBytes(this.config.saltLength, function(err, salt) {
            if (err) {
                callback(err);
            } else {
                salt = salt.toString('hex');
                crypto.pbkdf2(password, salt, self.config.keyIterations, self.config.keyLength, self.config.digest, (err, derivedKey) => {
                    if (err) {
                        return callback(new GenericError({
                            log: "auth.salt: error creating pbkdf2",
                            err: err
                        }));
                    }
                    callback(null, {
                        salt: salt,
                        key: derivedKey.toString('hex'),
                        keyIterations: self.config.keyIterations,
                        keyLength: self.config.keyLength,
                        digest: self.config.digest,
                        created: moment().format()
                    });
                });
            }
        });
    }

    hmac(password) {
        return crypto.createHmac('sha256', this.config["hmac-secret"]).digest(password).toString('hex');
    }

    verify(password, derivedKey, callback) {
        crypto.pbkdf2(password, derivedKey.salt, derivedKey.keyIterations, derivedKey.keyLength, derivedKey.digest, (err, verification) => {
            if (err) {
                return callback(new GenericError({
                    log: "auth.verify: error creating pbkdf2",
                    err: err,
                    metadata: [derivedKey]
                }));
            }
            callback(null, (verification.toString('hex') == derivedKey.key));
        });
    }

    login(email, password, res, callback) {
        var self = this;
        this.services.db.getUserByEmail(email, (err, user) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(null, false);
                } else {
                    return callback(err);
                }
            }
            self.verify(password, user.Data.password, (err, verified) => {
                if (err) {
                    callback(err);
                } else {
                    if (verified) {
                        self.setAuthCookie(email, res, (err, auth) => {
                            if (err) {
                                self.logger.error(err);
                                return res.status(401).end();
                            }
                            self.services.db.addUserAuth(user.Id, auth.token, auth, (err) => {
                                callback(err, true);
                            });
                        })
                    } else {
                        callback(null, false);
                    }
                }
            })
        })
    }

    logout(email, res, callback) {
        this.services.db.removeUserAuth(email, (err) => {
            res.clearCookie('auth');
            callback(err);
        })
    }

    preRegister(email, callback) {
        var self = this;
        if (!this.services.emailValidator.validate(email)) {
            return callback(new SchemaValidationError("email invalid", [email], [{
                message: "email should be a valid email address"
            }]))
        }
        //check if user exists already
        self.services.db.getUserByEmail(email, (err) => {
            if (nou.isNotNull(err) && err instanceof ItemNotFoundError) {
                //user does not exists, send verify mail
                crypto.randomBytes(this.preRegisterTokenLength, function(err, salt) {
                    if (err) {
                        self.logger.error({
                            err: err
                        }, "preRegister: error in crypto random bytes");
                        callback(err);
                    } else {
                        var token = salt.toString('hex');
                        self.services.db.addPreRegister({
                            email: email,
                            token: token,
                            timestamp: moment().format(),
                            emailValidated: false
                        }, (err, id) => {
                            if (err) {
                                self.logger.error({
                                    err: err
                                }, "preRegister: error saving pre register data in db");
                                return callback(err);
                            }
                            self.logger.debug("addPreRegister ok", email, id);
                            var url = self.config.url + "?id=" + id + "&token=" + token;
                            self.services.mailer.send({
                                to: email,
                                subject: "Please verify your email address",
                                content: "If you enrolled to our bread application, please verify your email by clicking on this link: " + url
                            }, (err) => {
                                if (err) {
                                    self.logger.error({
                                        err: err
                                    }, "preRegister: failed to send verification mail")
                                    return callback(err);
                                }
                                callback();
                            })
                        })

                    }
                });
            } else {
                //either unexpected error OR user exists
                if (err) {
                    self.logger.error({
                        err: err
                    }, "preRegister: error while looking for existing user with same email");
                    return callback(err);
                }
                return callback(new ItemExistsError("this email is already registered", [email]));
            }

        })
    }

    validatePreRegister(data, callback) {
        var self = this;
        this.services.db.getPreRegister(data.id, (err, preRegister) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                self.logger.error({
                    err: err
                }, "validatePreRegister: failed to get item from db");
                return callback(err);
            }
            self.logger.debug("validatePreRegister getPreRegister OK:", preRegister);
            if (preRegister.Token != data.token) {
                self.logger.error(preRegister, "validatePreRegister: token does not match");
                return callback(new GenericError({
                    description: "token does not match"
                }))
            } else {
                crypto.randomBytes(self.config.preRegisterTokenLength, function(err, salt) {
                    if (err) {
                        return callback(new GenericError({
                            log: "preRegister: error in crypto random bytes",
                            err: err,
                            metadata: [data, preRegister]
                        }))
                    } else {
                        preRegister.EmailValidated = true;
                        preRegister.Token = salt.toString('hex');
                        self.services.db.updatePreRegister(preRegister, (err) => {
                            if (err) {
                                return callback(new GenericError({
                                    log: "validatePreRegister: error updating validate = true in db",
                                    err: err,
                                    metadata: [data]
                                }))
                            }
                            callback(null, {
                                id: preRegister.Id,
                                token: preRegister.Token
                            });
                        })
                    }
                })

            }
        })
    }

    register(data, callback) {
        if (!this.services.ajv.validate("register", data)) {
            return callback(new SchemaValidationError("auth.register: error validating register json schema", [data], this.services.ajv.errors));
        }
        var self = this;
        this.services.db.getPreRegister(data.id, (err, preRegister) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "register: error getting preRegister from db",
                    metadata: [data.email, data.id]
                }))
            }
            if (preRegister.Token != data.token) {
                return callback(new GenericError({
                    description: "token does not match"
                }))
            } else {
                this.services.passwordPolicy.validate(data.password, (illegal) => {
                    if (illegal) {
                        return callback(new PasswordPolicyError(illegal));
                    }
                    self.services.db.getUserByEmail(data.email, (err, user) => {
                        if (err instanceof ItemNotFoundError) {
                            //user does not exist - add to db
                            self.saltAndPbkdf(data.password, (err, salted) => {
                                if (err) {
                                    return callback(err);
                                }
                                data.password = salted;
                                data.joined = moment().format();
                                delete data.id;
                                delete data.token;
                                self.services.db.addUser(data, (err, id) => {
                                    self.services.db.removePreRegister(preRegister, (err) => {
                                        if (err) {
                                            self.logger.error(err, "register: error removing pre register after registration completed");
                                        }
                                    })
                                    callback(err, id);
                                });
                            });
                        } else {
                            //user already registered
                            callback(new ItemExistsError("This email is already registered", [data.email]));
                        }
                    })
                });
            }
        })
    }

    setAuthCookie(email, resp, callback) {
        var self = this;
        crypto.randomBytes(24, function(err, randToken) {
            if (err) {
                callback(err);
            } else {
                var tokenStr = randToken.toString('hex');
                var auth = {
                    email: email,
                    token: tokenStr,
                    expiration: moment().add(90, 'd').unix()
                }
                resp.cookie('auth', tokenStr, {
                    secure: self.config.secure,
                    httpOnly: true,
                    maxAge: self.config.expiration,
                    sameSite: "strict"
                });
                self.cache.set(tokenStr, email, self.config.expiration);
                callback(null, auth);
            }
        });
    }

    randToken(callback) {
        crypto.randomBytes(this.config["xsrf-cookie-len"], function(err, randToken) {
            if (err) {
                callback(err);
            } else {
                callback(null, randToken.toString('hex'));
            }
        });
    }

    validateXsrfCookie(cookie, _csrf, ip) {
        var token = cookie.substring(0, this.config["xsrf-cookie-len"] * 2);
        var h = this.hmac(token + ip);
        return cookie.substring(this.config["xsrf-cookie-len"] * 2) == h && cookie == _csrf;
    }

    xsrf() {
        var self = this;
        return (req, res, next) => {
            self.logger.debug("xsrf");
            if (req.xsrf) {
                self.logger.debug("req.xsrf true");
                return next();
            }
            if (nou.isNull(req.cookies[self.config["xsrf-cookie-name"]]) && req.method == "GET") {
                self.logger.debug("req.xsrf creating xsrf token and cookie");
                self.randToken((err, token) => {
                    if (err) {
                        var gerr = new GenericError({
                            log: "xsrf: error creating random token for un autheticated session",
                            err: err
                        });
                        self.logger.error({
                            err: gerr
                        });
                        return res.status(500).end(gerr.description);
                    }
                    req.xsrf = true;
                    res.cookie(self.config["xsrf-cookie-name"], token + self.hmac(token + req.ip), {
                        secure: self.config.secure,
                        expires: 0,
                        httpOnly: false,
                        sameSite: "strict"
                    });
                    self.logger.debug("req.xsrf creating xsrf token and cookie - next");
                    return next();
                })
            }
            next();
        }
    }

    xsrfValidate() {
        var self = this;
        return (req, res, next) => {
            self.logger.debug("checking xsrf cookie");
            if (req.method == "GET" || req.method == "HEAD" || req.method == "OPTIONS") {
                self.logger.debug("checking xsrf cookie - skipping (get, head, options)");
                return next();
            }

            if (req.cookies[self.config["xsrf-cookie-name"]] && self.validateXsrfCookie(req.cookies[self.config["xsrf-cookie-name"]], req.body._csrf, req.ip)) {
                self.logger.debug("checking xsrf cookie - OK");
                next();
            } else {
                self.logger.warn("illegal xsrf token", req.cookies, req.ip);
                res.status(401).end();
            }
        }
    }

    isAuthenticated() {
        var self = this;
        return (req, res, next) => {
            // this.services.logger("isAuthenticated called")
            if (req.cookies && req.cookies.auth) {
                console.log("auth cookie found");
                var token = req.cookies.auth;
                var user = self.cache.get(token);
                if (user) {
                    //user is in cache
                    req.user = user;
                    req.auth = token;
                    next();
                } else {
                    this.services.db.getUserAuth(token, (err, data) => {
                        if (err) {
                            console.error("error in isAuthenticated", err);
                            return res.status(401).end();
                        } else {
                            if (nou.isNotNull(data)) {
                                req.user = data;
                                req.auth = token;
                                cache.set(token, data);
                                next();
                            } else {
                                res.status(401).end();
                            }
                        }
                    })
                }
            } else {
                res.status(401).end();
            }
        }
    }

}

module.exports = Auth