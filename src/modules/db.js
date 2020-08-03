const sql = require('mssql');
var nou = require("nou");
const SchemaValidationError = require('../errors/schema-validation-error.js');
const GenericError = require('../errors/generic-error.js');
const ItemNotFoundError = require('../errors/item-not-found-error.js');

class Db {

    constructor(config, services) {
        if (nou.isNull(config.db)) {
            throw new Error("configuration missing db section");
        }
        this.creds = config.db.creds;
        this.ajv = services.ajv;
        this.logger = services.logger.child({
            module: "db"
        });
    }

    connect(callback) {
        var self = this;
        sql.on('error', err => {
            self.logger.error(err, "unexpected error in db");
            throw err;
        })
        sql.connect(this.creds).then((pool) => {
            self.pool = pool;
            callback();
        })
    }

    //////user ----------------------------------------------------------------

    getUserByEmail(email, callback) {
        this.getSingle("select * from [User] where Email = @email", [{
            name: "email",
            type: sql.NVarChar(320),
            value: email
        }], callback);
    }

    getUser(id, callback) {
        this.getSingle("select * from [User] where Id = @id", [{
            name: "id",
            type: sql.Int,
            value: id
        }], callback);
    }

    deleteUser(email, callback) {
        this.getUserByEmail(email, (err, doc) => {
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
            this.delete("User", doc.Id, (err, deleted) => {
                if (err) {
                    if (err instanceof ItemNotFoundError) {
                        return callback(err)
                    }
                    return callback(new GenericError({
                        log: "db.deleteUser: error while deleting user",
                        err: err,
                        metadata: [email]
                    }));
                }
                //todo: delete all user's recipes and reviews???
                callback(null, deleted);
            });
        })
    }

    addUser(email, data, callback) {
        this.insert('User', [{
            name: "Email",
            type: sql.NVarChar(320),
            value: email
        }, {
            name: "Data",
            type: sql.NVarChar,
            value: JSON.stringify(data)
        }], (err, id) => {
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

    query(query, params, callback) {
        var self = this;
        const ps = new sql.PreparedStatement()
        var paramsObj = {}
        params.forEach((param) => {
            ps.input(param.name, param.type);
            paramsObj[param.name] = param.value;
        });

        ps.prepare(query, err => {
            if (err) {
                return callback(new GenericError({
                    err: err,
                    log: "error in db get prepare",
                    metadata: [query, params]
                }))
            }

            ps.execute(paramsObj, (err, result) => {
                if (err) {
                    return callback(new GenericError({
                            err: err,
                            log: "error in db query execute",
                            metadata: [query, params]
                        }))
                        //TODO: do I need this?
                        // ps.unprepare((err) => {
                        //     self.logger.error(err, "unexpected error in db query unprepare after error occured in execute")
                        // })
                        // return;
                }

                ps.unprepare(err => {
                    if (err) {
                        self.logger.error(err, "unexpected error in db query unprepare after succesfull execute")
                    }
                    callback(null, result);
                })
            })
        })
    }


    insert(table, params, callback) {
        var q = "insert into [" + table + "] values(" + params.map(i => "@" + i.name).join(",") + "); SELECT SCOPE_IDENTITY() as Id";
        this.query(q, params, (err, result) => {
            if (err) {
                return callback(new GenericError({
                    err: err,
                    log: "db insert error",
                    metadata: [table, params, q]
                }));
            }
            if (nou.isNull(result.recordset) || nou.isNull(result.recordset[0]) || nou.isNull(result.recordset[0].Id)) {
                return callback(new GenericError({
                    log: "db insert did not return Id properly",
                    metadata: [table, params, q, result]
                }));
            }
            callback(null, result.recordset[0].Id);
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


    get(query, params, callback) {
        this.query(query, params, (err, result) => {
            if (err) {
                callback(err);
            } else {
                result.recordsets.forEach((dataset) => {
                    dataset.forEach((item) => {
                        if (item.Data) {
                            try {
                                item.Data = JSON.parse(item.Data);
                            } catch (ex) {
                                self.logger.error(new GenericError({
                                    err: ex,
                                    log: "db.get failure to parse json from result",
                                    metadata: [query, params, item]
                                }));
                            }
                        }
                    })
                });
                callback(null, result);
            }
        });
    }


    getSingle(query, params, callback) {
        this.get(query, params, (err, result) => {
            if (err) {
                callback(err);
            } else {
                if (result.recordsets.length > 0 && result.recordsets[0].length > 0) {
                    callback(null, result.recordsets[0][0]);
                } else {
                    callback(new ItemNotFoundError("db.getSingle item not found", [query, params]));
                }
            }
        })
    }

    delete(table, id, callback) {
        this.query("delete from [" + table + "] where Id = @id", [{
            name: "id",
            type: sql.Int,
            value: id
        }], (err, result) => {
            if (err) {
                callback(err);
            } else {
                if (result.rowsAffected < 1) {
                    return callback(new ItemNotFoundError("db delete not found", [table, id]));
                }
                callback(null, result.rowsAffected);
            }
        });
    }

}

module.exports = Db;