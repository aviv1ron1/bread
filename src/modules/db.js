var _Cloudant = require('@cloudant/cloudant');
var nou = require("nou");
const SchemaValidationError = require('../errors/schema-validation-error.js');
const GenericError = require('../errors/generic-error.js');
const ItemNotFoundError = require('../errors/item-not-found-error.js');

class Db {

    constructor(config, services) {
        if (nou.isNull(config.db)) {
            throw new Error("configuration missing db section");
        }
        this.creds = {
            account: config.db.username,
            password: config.db.password,
            url: config.db.url
        }
        this.ajv = services.ajv;
        this.logger = services.logger.child({
            module: "db"
        });
    }

    connect(callback) {
        this.cloudant = _Cloudant(this.creds, (err) => {
            if (err) {
                callback(new GenericError({
                    log: "failed to connect to cloudant in db.js",
                    err: err
                }));
            } else {
                console.log("connected to cloudant");
                callback();
            }
        });
    }

    //////user ----------------------------------------------------------------

    getUserByEmail(email, callback) {
        this.find("users", {
            email: email
        }, function(err, result) {
            if (err) {
                callback(new GenericError({
                    log: "db.getUserByEmail: failed in get",
                    err: err,
                    metadata: [email]
                }));
            } else {
                if (result.docs.length == 0) {
                    callback(new ItemNotFoundError("db.getUser: user not found", [email, result]));
                } else {
                    callback(null, result.docs[0]);
                }
            }
        });
    }

    getUser(id, callback) {
        this.get("users", id, function(err, result) {
            if (err) {
                callback(new GenericError({
                    log: "db.getUser: failed in find",
                    err: err,
                    metadata: [email]
                }));
            } else {
                if (result.docs.length == 0) {
                    callback(new ItemNotFoundError("db.getUser: user not found", [email, result]));
                } else {
                    callback(null, result.docs[0]);
                }
            }
        });
    }

    deleteUser(email, callback) {
        this.getUser(email, (err, doc) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                } else {
                    return callback(new GenericError({
                        log: "db.deleteUser: error checking if user exists in getUser",
                        err: err,
                        metadata: [email]
                    }));
                }
            }
            this.delete("users", doc._id, doc._rev, (err) => {
                if (err) {
                    return callback(new GenericError({
                        log: "db.deleteUser: error while deleting user",
                        err: err,
                        metadata: [email]
                    }));
                }
                this.removeUserAuth(email, callback);
            });
            //todo: delete all user's recipes and reviews
        })
    }

    addUser(data, callback) {
        this.insert('users', data, (err, id) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.addUser: error inserting to db",
                    err: err,
                    metadata: [data]
                }));
            }
            callback(null, id);
        })
    }

    //////pre-register ----------------------------------------------------------------

    setPreRegister(data, callback) {
        this.insert("pre-register", data, (err, id) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.setPreRegister: error inserting to db",
                    err: err,
                    metadata: [data]
                }));
            }
            callback(null, id);
        });
    }

    updatePreRegister(preRegister, callback) {
        this.update("pre-register", preRegister, (err, id) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.updatePreRegister: error updating in db",
                    err: err,
                    metadata: [preRegister]
                }));
            }
            callback(null, id);
        })
    }

    removePreRegister(preRegister, callback) {
        this.delete("pre-register", preRegister._id, preRegister._rev, (err) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.removePreRegister: error in delete",
                    err: err,
                    metadata: [id, rev]
                }));
            }
            callback();
        })

    }

    getPreRegister(id, callback) {
        this.get("pre-register", id, (err, data) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.getUserAuth: error in find",
                    err: err,
                    metadata: [token]
                }));
            }
            callback(null, data);
        })
    }

    deleteExpiredPreRegisters(expirationDays, callback) {
        this.find("pre-register", {
            timestamp: {
                "$lte": moment().subtract(expirationDays, "d").format()
            }
        }, (err, results) => {
            if (err) {
                return callback(err)
            }
            this.db.use("pre-register").bulk({
                docs: results.map((i) => {
                    return {
                        _id: i.id,
                        _rev: i._rev,
                        _deleted: true
                    }
                })
            }, (err, body, headers) => {
                if (err) {
                    return callback(new GenericError({
                        log: "db.deleteExpiredPreRegisters: error bulk deleting from db",
                        err: err,
                        metadata: [results, body, headers]
                    }));
                }
                if (!body.ok) {
                    return callback(new GenericError({
                        log: "db.deleteExpiredPreRegisters: error, body not ok",
                        metadata: [results, body, headers]
                    }));
                }
                callback(null, results.length);
            });
        })
    }


    //////auth ----------------------------------------------------------------

    setUserAuth(data, callback) {
        this.insert("auth", data, (err) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.setUserAuth: error inserting to db",
                    err: err,
                    metadata: [data]
                }));
            }
            callback();
        })
    }

    removeUserAuth(email, callback) {
        this.find("auth", {
            email: email
        }, (err, data) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.removeUserAuth: error in find",
                    err: err,
                    metadata: [email]
                }));
            }
            this.delete("auth", data[0]._id, data[0]._rev, (err) => {
                if (err) {
                    return callback(new GenericError({
                        log: "db.removeUserAuth: error in delete",
                        err: err,
                        metadata: [email, data]
                    }));
                }
                callback();
            })

        })
    }

    getUserAuth(token, callback) {
        this.find("auth", {
            token: token
        }, (err, data) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.getUserAuth: error in find",
                    err: err,
                    metadata: [token]
                }));
            }
            callback(null, data);
        })
    }


    //////matconim ----------------------------------------------------------------

    getMatcon(id, callback) {
        this.get("matconim", id, (err, item) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.getMatcon: error in find",
                    err: err,
                    metadata: [id]
                }))
            }
            callback(null, item);
        })
    }

    addMatcon(matcon, callback) {
        if (!this.ajv.validate("matcon", matcon)) {
            return callback(new SchemaValidationError("db.addMatcon: error validating recipe json schema", [matcon], ajv.errors));
        }
        this.insert("matconim", matcon, (err, id) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.addMatcon: error inserting to db",
                    err: err,
                    metadata: [matcon]
                }));
            }
            callback(null, id);
        })
    }

    updateMatcon(matcon, callback) {
        if (!this.ajv.validate("matcon", matcon)) {
            return callback(new SchemaValidationError("db.updateMatcon: error validating recipe json schema", [matcon], ajv.errors));
        }
        this.update("matconim", matcon, (err) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.updateMatcon: error inserting to db",
                    err: err,
                    metadata: [matcon]
                }));
            }
            callback();
        })
    }

    deleteMatcon(id, callback) {
        this.getMatcon(id, (err, matcon) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.deleteMatcon: error in getMatcon",
                    err: err,
                    metadata: [id]
                }));
            }
            this.delete("matconim", matcon._id, matcon._rev, (err) => {
                if (err) {
                    return callback(new GenericError({
                        log: "db.deleteMatcon: error in delete",
                        err: err,
                        metadata: [id, matcon]
                    }));
                }
                callback();
            })
        })
    }

    //reviews -------------------------------------------------------------------------------

    addReview(review, callback) {
        if (!this.ajv.validate("review", review)) {
            return callback(new SchemaValidationError("db.addMatcon: error validating review json schema", [review], ajv.errors));
        }
        this.insert("reviews", review, (err, id) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.addReview: error inserting to db",
                    err: err,
                    metadata: [review]
                }));
            }
            callback(null, id);
        })
    }

    getReview(id, callback) {
        this.get("reviews", id, (err, item) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.getReview: error in find",
                    err: err,
                    metadata: [id]
                }))
            }
            callback(null, item);
        })
    }

    updateReview(review, callback) {
        if (!this.ajv.validate("reviews", review)) {
            return callback(new SchemaValidationError("db.updateReview: error validating review json schema", [review], ajv.errors));
        }
        this.update("reviews", review, (err) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.updateReview: error inserting to db",
                    err: err,
                    metadata: [review]
                }));
            }
            callback();
        })
    }

    deleteReview(id, callback) {
        this.getReview(id, (err, review) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.deleteReview: error in getReview",
                    err: err,
                    metadata: [id]
                }));
            }
            this.delete("reviews", review._id, review._rev, (err) => {
                if (err) {
                    return callback(new GenericError({
                        log: "db.deleteReview: error in delete",
                        err: err,
                        metadata: [id, review]
                    }));
                }
                callback();
            })
        })
    }

    getReviewsForMatcon(matconId, callback) {
        this.find("reviews", {
            matconId: matconId
        }, (err, results) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.getReviewsForMatcon: error in find",
                    err: err,
                    metadata: [matconId]
                }));
            }
            callback(null, results);
        })
    }

    getReviewsForUser(userId, callback) {
        this.find("reviews", {
            userId: userId
        }, (err, results) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.getReviewsForUser: error in find",
                    err: err,
                    metadata: [matconId]
                }));
            }
            callback(null, results);
        })
    }


    //basic generic crud --------------------------------------------------------------------

    insert(coll, document, callback) {
        this.cloudant.use(coll).insert(document, (err, body, headers) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.insert: error",
                    err: err,
                    metadata: [coll, document]
                }));
            }
            if (!body.ok) {
                return callback(new GenericError({
                    log: "db.insert: error, body not ok",
                    metadata: [coll, document, body, headers]
                }));
            }
            callback(null, {
                id: body.id,
                rev: body.rev
            });
        })
    }


    update(coll, document, callback) {
        this.cloudant.use(coll).insert(document, (err, body, headers) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.update: error",
                    err: err,
                    metadata: [coll, document]
                }));
            }
            if (!body.ok) {
                return callback(new GenericError({
                    log: "db.update: error, body not ok",
                    metadata: [coll, document, body, headers]
                }));
            }
            callback(null, {
                id: body.id,
                rev: body.rev
            });
        })
    }

    get(coll, id, callback) {
        this.cloudant.use(coll).get(id, function(err, result) {
            if (err) {
                if (err.error == "not_found") {
                    return callback(new ItemNotFoundError("not found", [coll, id]))
                }
                return callback(new GenericError({
                    log: "db.get: error",
                    err: err,
                    metadata: [coll, id, document]
                }));
            }
            callback(null, result);
        });
    }

    find(coll, selector, callback) {
        this.cloudant.use(coll).find({
            selector: selector
        }, function(err, result) {
            if (err) {
                return callback(new GenericError({
                    log: "db.find: error",
                    err: err,
                    metadata: [coll, selector]
                }));
            }
            if (result.docs.length == 0) {
                return callback(new ItemNotFoundError("not found", [coll, selector]))
            }
            callback(null, result.docs);
        });
    }

    delete(coll, _id, _rev, callback) {
        this.cloudant.use(coll).destroy(doc._id, doc._rev, (err, body, headers) => {
            if (err) {
                if (err.error == "not_found") {
                    return callback(new ItemNotFoundError("not found", [coll, id]))
                }
                return callback(new GenericError({
                    log: "db.delete: error",
                    err: err,
                    metadata: [coll, _id, _rev]
                }));
            }
            if (!body.ok) {
                return callback(new GenericError({
                    log: "db.delete: error, body not ok",
                    metadata: [coll, _id, _rev, body, headers]
                }));
            }
            callback();
        });
    }


}

module.exports = Db;