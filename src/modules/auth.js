const crypto = require('crypto');
const moment = require('moment');
const nou = require('nou');
const GenericError = require('../errors/generic-error.js');
const ItemNotFoundError = require('../errors/item-not-found-error.js');
const PasswordPolicyError = require('../errors/password-policy-error.js');
const SchemaValidationError = require('../errors/schema-validation-error.js');
const ItemExistsError = require('../errors/item-exists-error.js');


const COOKIE_EXPIRATION = 90 /*days*/ * 24 /*hours*/ * 60 /*min*/ * 60 /*sec*/ * 1000;

class Auth {

    constructor(config, services) {
        this.db = services.db;
        this.passwordPolicy = services.passwordPolicy;
        this.mailer = services.mailer;
        this.ajv = services.ajv;
        this.emailValidator = services.emailValidator;
        this.saltLength = 20;
        this.keyIterations = 100000;
        this.keyLength = 128;
        this.digest = "sha512";
        this.preRegisterTokenLength = 20;
        this.url = "http://localhost:8080";
        if (nou.isNotNull(config) && nou.isNotNull(config.auth)) {
            for (let [key, value] of Object.entries(config.auth)) {
                this[key] = value;
            }
        }
        this.logger = services.logger.child({
            module: "auth"
        });
    }

    salt(password, callback) {
        var salt = [];
        var self = this;
        crypto.randomBytes(this.saltLength, function(err, salt) {
            if (err) {
                callback(err);
            } else {
                salt = salt.toString('hex');
                crypto.pbkdf2(password, salt, self.keyIterations, self.keyLength, self.digest, (err, derivedKey) => {
                    if (err) {
                        return callback(new GenericError({
                            log: "auth.salt: error creating pbkdf2",
                            err: err
                        }));
                    }
                    callback(null, {
                        salt: salt,
                        key: derivedKey.toString('hex'),
                        keyIterations: self.keyIterations,
                        keyLength: self.keyLength,
                        digest: self.digest,
                        created: moment().format()
                    });
                });
            }
        });
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

    login(email, password, callback) {
        var self = this;
        this.db.getUserByEmail(email, (err, user) => {
            if (err) {
                return callback(err);
            }
            self.verify(password, user.password, (err, verified) => {
                callback(err, verified);
            })
        })
    }

    preRegister(email, callback) {
        var self = this;
        if (!this.emailValidator.validate(email)) {
            return callback(new SchemaValidationError("email invalid", [email], [{
                message: "email should be a valid email address"
            }]))
        }
        //check if user exists already
        self.db.getUserByEmail(email, (err) => {
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
                        self.db.setPreRegister({
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
                            var url = self.url + "/verify?id=" + id.id + "&token=" + token;
                            self.mailer.send({
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
        this.db.getPreRegister(data.id, (err, preRegister) => {
            if (err) {
                 if(err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                self.logger.error({
                    err: err
                }, "validatePreRegister: failed to get item from db");
                return callback(err);
            }
            if (preRegister.token != data.token) {
                self.logger.error(preRegister, "validatePreRegister: token does not match");
                return callback(new GenericError({
                    description: "token does not match"
                }))
            } else {
                crypto.randomBytes(self.preRegisterTokenLength, function(err, salt) {
                    if (err) {
                        return callback(new GenericError({
                            log: "preRegister: error in crypto random bytes",
                            err: err,
                            metadata: [data, preRegister]
                        }))
                    } else {
                        preRegister.emailValidated = true;
                        preRegister.token = salt.toString('hex');
                        self.db.updatePreRegister(preRegister, (err) => {
                            if (err) {
                                return callback(new GenericError({
                                    log: "validatePreRegister: error updating validate = true in db",
                                    err: err,
                                    metadata: [data]
                                }))
                            }
                            callback(null, { id: preRegister._id, token: preRegister.token });
                        })
                    }
                })

            }
        })
    }

    register(data, callback) {
        if (!this.ajv.validate("register", data)) {
            return callback(new SchemaValidationError("auth.register: error validating register json schema", [data], this.ajv.errors));
        }
        var self = this;
        this.db.getPreRegister(data.id, (err, preRegister) => {
            if (err) {
                if(err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "register: error getting preRegister from db",
                    metadata: [data.email, data.id]
                }))
            }
            if (preRegister.token != data.token) {
                return callback(new GenericError({
                    description: "token does not match"
                }))
            } else {
                this.passwordPolicy.validate(data.password, (illegal) => {
                    if (illegal) {
                        return callback(new PasswordPolicyError(illegal));
                    }
                    self.db.getUserByEmail(data.email, (err, user) => {
                        if (err instanceof ItemNotFoundError) {
                            //user does not exist - add to db
                            self.salt(data.password, (err, salted) => {
                                if (err) {
                                    return callback(err);
                                }
                                data.password = salted;
                                data.joined = moment().format();
                                delete data.id;
                                delete data.token;
                                self.db.addUser(data, (err, id) => {
                                    self.db.removePreRegister(preRegister, (err) => {
                                        if(err) {
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
                    secure: SECURE_COOKIE,
                    httpOnly: true,
                    maxAge: COOKIE_EXPIRATION
                });

                this.db.setUserAuth(auth, (err) => {
                    callback(err, auth);
                });
            }
        });
    }

    removeAuthCookie(email, callback) {
        this.db.removeUserAuth(email, (err) => {
            callback(err);
        })
    }

    isAuthenticated(req, res, next) {
        //console.log("isAuthenticated called");
        if (req.cookies && req.cookies.auth) {
            // console.log("auth cookie found");
            var token = req.cookies.auth;
            this.db.getUserAuth(token, (err, data) => {
                if (err) {
                    console.error("error in isAuthenticated", err);
                    return res.status(401).end();
                } else {
                    if (nou.isNotNull(data) && nou.isNotNull(data[0])) {
                        req.user = data[0].email;
                        next();
                    } else {
                        res.status(401).end();
                    }
                }
            })
        }
    }

}

module.exports = Auth