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
            cacheExpiration: 7776000000,
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
        setTimeout(() => {
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
                        self.logger.error("login, self.verify", err);
                        callback(err);
                    } else {
                        if (verified) {
                            self.setAuthCookie(user.Id, email, user.Data.name, res, (err, auth) => {
                                if (err) {
                                    self.logger.error("login, self.setAuthCookie", err);
                                    return callback(err);
                                }
                                self.logger.debug("login user auth", auth)
                                self.services.db.addUserAuth(user.Id, auth.token, auth, (err) => {
                                    if (err) {
                                        self.logger.error("login, self.services.db.addUserAuth", err);
                                        return callback(err);
                                    }
                                    req.user = {
                                        email: user.Email,
                                        name: user.Data.name,
                                        id: user.Id
                                    }
                                    self.cache.set(auth.token, req.user, self.config.cacheExpiration)
                                    callback(null, true, req.user);
                                });
                            })
                        } else {
                            self.logger.debug("wrong credentials", password, user.Data.password)
                            callback(null, false);
                        }
                    }
                })
            })
        }, Math.floor(Math.random() * 2000));
        //2 sec random is to make it harder for timing side channel attacks
    }

    logout(email, res, callback) {
        this.services.db.removeUserAuth(email, (err) => {
            res.clearCookie('auth');
            callback(err);
        })
    }

    register(email, name, password, callback) {
        var self = this;
        if (!this.services.emailValidator.validate(email)) {
            return callback(new SchemaValidationError("email invalid", [email], [{
                message: "email should be a valid email address"
            }]))
        }
        this.services.passwordPolicy.validate(password, (illegal) => {
            if (illegal) {
                return callback(new PasswordPolicyError(illegal));
            } else {
                //check if user exists already
                self.services.db.getUserByEmail(email, (err) => {
                    if (nou.isNotNull(err) && err instanceof ItemNotFoundError) {
                        //user does not exists, send verify mail
                        crypto.randomBytes(self.config.preRegisterTokenLength, function(err, salt) {
                            if (err) {
                                self.logger.error(err, "preRegister: error in crypto random bytes");
                                callback(err);
                            } else {
                                var token = salt.toString('hex');
                                self.saltAndPbkdf(password, (err, salted) => {
                                    if (err) {
                                        self.logger.error(err, "preRegister: error in saltAndPbkdf");
                                        return callback(err);
                                    }
                                    self.services.db.addPreRegister({
                                        email: email,
                                        name: name,
                                        password: JSON.stringify(salted),
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
                                                self.logger.error(err, "preRegister: failed to send verification mail")
                                                return callback(err);
                                            }
                                            callback();
                                        })
                                    })
                                })
                            }
                        });
                    } else {
                        //either unexpected error OR user exists
                        if (err) {
                            self.logger.error(err, "preRegister: error while looking for existing user with same email");
                            return callback(err);
                        }
                        return callback(new ItemExistsError("this email is already registered", [email]));
                    }

                })
            }
        });
    }

    validateRegister(data, callback) {
        var self = this;
        this.services.db.getPreRegister(data.id, (err, preRegister) => {
            if (err) {
                self.logger.error("validateRegister db.getPreRegister error", err);
                return callback(err);
            }
            self.logger.debug("validateRegister getPreRegister OK:", preRegister);
            if (preRegister.Token != data.token) {
                self.logger.error(preRegister, "validateRegister: token does not match");
                return callback(new GenericError({
                    description: "token does not match"
                }))
            } else {
                data = {
                    email: preRegister.Email,
                    name: preRegister.Name,
                    joined: moment().format(),
                    password: preRegister.Password
                }
                self.services.db.addUser(data, (err, id) => {
                    if (err) {
                        self.logger.error(err, "validateRegister: error in self.services.db.addUser");
                        return callback(err);
                    }
                    self.services.db.removePreRegister(preRegister.Id, (err) => {
                        if (err) {
                            self.logger.error(err, "validateRegister: error removing pre register after registration completed");
                        }
                    })
                    callback(null, id);
                });
            }
        })
    }

    setAuthCookie(id, email, name, resp, callback) {
        var self = this;
        crypto.randomBytes(24, function(err, randToken) {
            if (err) {
                callback(new GenericError({
                    log: "setAuthCookie - error in crypto.randomBytes",
                    err: err
                }));
            } else {
                var tokenStr = randToken.toString('hex');
                self.logger.debug("setAuthCookie tokenStr", tokenStr)
                var auth = {
                    email: email,
                    name: name,
                    id: id,
                    token: tokenStr,
                    expiration: moment().add(90, 'd').unix()
                }
                resp.cookie('auth', tokenStr, {
                    secure: self.config.secure,
                    httpOnly: true,
                    maxAge: self.config.expiration,
                    sameSite: "strict"
                });
                callback(null, auth);
            }
        });
    }

    randToken(callback) {
        crypto.randomBytes(this.config["xsrf-cookie-len"], function(err, randToken) {
            if (err) {
                callback(new GenericError({
                    log: "randToken - error in crypto.randomBytes",
                    err: err
                }));
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
                //self.logger.debug("req.xsrf true");
                return next();
            }
            if (nou.isNull(req.cookies[self.config["xsrf-cookie-name"]]) && req.method == "GET") {
                self.logger.debug("req.xsrf creating xsrf token and cookie");
                self.randToken((err, token) => {
                    if (err) {
                        self.logger.error(err, "xsrf() error in self.randToken");
                        return next(new GenericError({
                            log: "xsrf: error creating random token for un autheticated session",
                            err: err
                        }));
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
            if (req.cookies[self.config["xsrf-cookie-name"]] && self.validateXsrfCookie(req.cookies[self.config["xsrf-cookie-name"]], req.get(self.config["xsrf-header-name"]), req.ip)) {
                self.logger.debug("checking xsrf cookie - OK");
                next();
            } else {
                self.logger.warn("illegal xsrf token", req.cookies, req.ip);
                res.status(401).end("Illegal cross site request token, try refreshing the page");
            }
        }
    }

    isAuthenticated() {
        var self = this;
        return (req, res, next) => {
            self.logger.debug("isAuthenticated called")
            if (req.cookies && req.cookies.auth) {
                self.logger.debug("auth cookie found");
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
                            if (err instanceof ItemNotFoundError) {
                                return res.status(401).end();
                            }
                            self.logger.error("isAuthenticated error in this.services.db.getUserAuth", err);
                            next(new GenericError({
                                log: "isAuthenticated error in this.services.db.getUserAuth",
                                err: err
                            }))
                        } else {
                            self.logger.debug("isAuthenticated: got user auth", data, data.Data)
                            if (nou.isNotNull(data)) {
                                req.user = {
                                    email: data.Data.email,
                                    name: data.Data.name, 
                                    id: data.UserId
                                };
                                req.auth = token;
                                self.cache.set(token, req.user, self.config.cacheExpiration);
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