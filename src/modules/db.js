//const sql = require('mssql');
const sql = require('mysql');
var nou = require("nou");
const BasicModule = require('./basic-module.js');
const SchemaValidationError = require('../errors/schema-validation-error.js');
const GenericError = require('../errors/generic-error.js');
const ItemNotFoundError = require('../errors/item-not-found-error.js');

class Db extends BasicModule {

    constructor(config, services) {
        super("db", config, services)
        this.ajv = services.ajv;
        this.init();
    }

    connect(callback) {
        var self = this;

        this.connection = sql.createPool({
            connectionLimit: this.config.connectionLimit,
            host: this.config.endpoint,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password,
            database: this.config.db
        });

        callback();

        // this.connection.connect(function(err) {
        //     if (err) {
        //         self.logger.error(err, 'error connecting to mysql');
        //         return callback(err);
        //     }
        //     callback();
        // });

    }

    //////user ----------------------------------------------------------------

    getUserByEmail(email, callback) {
        this.getSingle("select * from `user` where `Email` = ?", [email], callback);
    }

    getUser(id, callback) {
        this.getById("user", id, callback);
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
            this.delete("user", doc.Id, (err, deleted) => {
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

    addUser(data, callback) {
        this.insert('user', {
            "Email": data.email,
            "Data": JSON.stringify(data)
        }, (err, id) => {
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

    addPreRegister(data, callback) {
        this.insert('preregister', {
            "Email": data.email,
            "Token": data.token,
            "Timestamp": data.timestamp,
            "EmailValidated": data.emailValidated
        }, (err, id) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.setPreRegister: error inserting to db",
                    err: err,
                    metadata: [data]
                }));
            }
            callback(null, id);
        })
    }

    updatePreRegister(data, callback) {
        this.update("preregister", data.Id, {
            "Email": data.Email,
            "Token": data.Token,
            "Timestamp": data.Timestamp,
            "EmailValidated": data.EmailValidated
        }, (err) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.updatePreRegister: error updating in db",
                    err: err,
                    metadata: [data]
                }));
            }
            callback();
        })
    }

    removePreRegister(id, callback) {
        this.delete("preregister", id, (err, deleted) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err)
                }
                return callback(new GenericError({
                    log: "db.removePreRegister: error while deleting",
                    err: err,
                    metadata: [id]
                }));
            }
            callback(null, deleted);
        });
    }

    getPreRegister(id, callback) {
        this.getById("preregister", id, callback);
    }

    deleteExpiredPreRegisters(expirationDays, callback) {
        this.execute("DeleteOldPreRegisters", {
            "ExpirationDays": expirationDays
        }, (err, result) => {
            if (err) {
                return callback(new GenericError({
                    log: "db deleteExpiredPreRegisters error",
                    err: err,
                    metadata: [expirationDays]
                }))
            }
            callback(null, result.recordset[0].Deleted)
        })
    }


    //////auth ----------------------------------------------------------------

    addUserAuth(userId, token, data, callback) {
        this.insert('userauth', {
            "UserId": userId,
            "Token": token,
            "Data": JSON.stringify(data)
        }, (err, id) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.addUserAuth: error inserting to db",
                    err: err,
                    metadata: [userId, data]
                }));
            }
            callback(null, id);
        })
    }

    removeUserAuth(email, callback) {
        this.query("DELETE `userauth` FROM `userauth` INNER JOIN `user` on `userauth`.`UserId` = `user`.`Id` WHERE `Email` = ?l", [email], (err, result) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.removeUserAuth: error while deleting",
                    err: err,
                    metadata: [email]
                }));
            }
            callback(null, result.affectedRows);
        });
    }

    getUserAuth(token, callback) {
        this.getSingle("SELECT `user`.* FROM `userauth` INNER JOIN `user` ON `userauth`.`UserId` = `user`.`Id` WHERE `Token` = ?", [token], callback);
    }

    //////matconim ----------------------------------------------------------------

    getMatcon(id, callback) {
        this.execute("GetMatcon", {
            "Id": id
        }, (err, result) => {
            if (err) {
                return callback(new GenericError({
                    log: "db getMatcon error",
                    err: err,
                    metadata: [id]
                }))
            }
            callback(null, result);
        })
    }

    addMatcon(matcon, callback) {
        if (!this.ajv.validate("db-matcon", matcon)) {
            return callback(new SchemaValidationError("db.addMatcon: error validating recipe json schema", [matcon], ajv.errors));
        }
        var userId = matcon.userId;
        delete matcon.userId;
        var name = matcon.name;
        delete matcon.name;
        this.insert('matcon', {
            "UserId": userId,
            "Name": name,
            "Rating": 0,
            "Data": JSON.stringify(matcon)
        }, (err, id) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.addMatcon: error inserting to db",
                    err: err,
                    metadata: [userId, name, matcon]
                }));
            }
            callback(null, id);
        })
    }

    updateMatcon(id, matcon, callback) {
        if (!this.ajv.validate("matcon", matcon)) {
            return callback(new SchemaValidationError("db.updateMatcon: error validating recipe json schema", [id, matcon], ajv.errors));
        }
        delete matcon.userId;
        var name = matcon.name;
        delete matcon.name;
        this.update("matcon", id, {
            "Name": name,
            "Data": JSON.stringify(matcon)
        }, (err) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.updateMatcon: error updating to db",
                    err: err,
                    metadata: [id, matcon]
                }));
            }
            callback();
        });
    }

    deleteMatcon(id, callback) {
        this.delete("matcon", id, (err, deleted) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err)
                }
                return callback(new GenericError({
                    log: "db.deleteMatcon: error while deleting",
                    err: err,
                    metadata: [id]
                }));
            }
            callback(null, deleted);
        });
    }

    //reviews -------------------------------------------------------------------------------

    addReview(review, callback) {
        if (!this.ajv.validate("review", review)) {
            return callback(new SchemaValidationError("db.addReview: error validating review json schema", [review], this.ajv.errors));
        }
        this.execute("AddReview", {
            "MatconId": review.matconId,
            "Rating": review.score,
            "UserId": review.userId,
            "Data": review.content
        }, (err, result) => {
            if (err) {
                return callback(new GenericError({
                    log: "db addReview error",
                    err: err,
                    metadata: [review]
                }))
            }
            callback();
        })
    }

    getReview(id, callback) {
        this.getById("matconrating", id, (err, item) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.getReview: error",
                    err: err,
                    metadata: [id]
                }))
            }
            callback(null, item);
        })
    }

    deleteReview(id, callback) {
        this.execute("DeleteReview", {
            "Id": id
        }, (err, result) => {
            if (err) {
                return callback(new GenericError({
                    log: "db deleteReview error",
                    err: err,
                    metadata: [id]
                }))
            }
            callback();
        })
    }

    getReviewsForMatcon(matconId, callback) {
        this.get("SELECT * FROM `matconrating` WHERE `MatconId` = ? ORDER BY `Timestamp` DESC", [matconId], (err, results) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.getReviewsForMatcon: error in get",
                    err: err,
                    metadata: [matconId]
                }));
            }
            callback(null, results);
        })
    }

    getReviewsForUser(userId, callback) {
        this.get("SELECT * FROM `matconrating` WHERE `UserId` = ? ORDER BY `Timestamp` DESC", [userId], (err, results) => {
            if (err) {
                if (err instanceof ItemNotFoundError) {
                    return callback(err);
                }
                return callback(new GenericError({
                    log: "db.getReviewsForUser: error in get",
                    err: err,
                    metadata: [userId]
                }));
            }
            callback(null, results);
        })
    }

    //tags ----------------------------------------------------------------------------------

    addTag(tag, callback) {
        this.insert("tag", {
            tag: tag
        }, (err, id) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.addTag: error inserting to db",
                    err: err,
                    metadata: [tag]
                }));
            }
            callback(null, id);
        })
    }

    addMatconTag(matconId, tagId, callback) {
        this.insert("matcontag", {
            MatconId: matconId,
            TagId: tagId
        }, (err, id) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.addMatconTag: error inserting to db",
                    err: err,
                    metadata: [matconId, tagId]
                }));
            }
            callback(null, id);
        })
    }

    getTags(search, callback) {
        this.query("SELECT * FROM `tag` WHERE `tag` LIKE ?", "%" + search + "%", (err, result) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.getTags: error while getting",
                    err: err,
                    metadata: [search]
                }));
            }
            callback(null, result);
        })
    }

    //basic generic crud --------------------------------------------------------------------

    execute(storedProcedure, inParams, callback) {
        var self = this;
        this.query("CALL " + storedProcedure + " (?)", inParams, (err, result) => {
            if (err) {
                return callback(new GenericError({
                    log: "db execute error",
                    err: err,
                    metadata: [storedProcedure, inParams]
                }))
            }
            callback(null, result);
        })
    }

    query(query, params, callback) {
        var self = this;
        self.logger.debug("query", query, params);
        this.connection.query(query, params, (err, results, fields) => {
            if (err) {
                return callback(new GenericError({
                    err: err,
                    log: "error in db query",
                    metadata: [query, params]
                }))
            }
            self.logger.debug("query OK", query, results);
            callback(null, results)
        })
    }


    insert(table, params, callback) {
        var q = "insert into `" + table + "` SET ?";
        this.query(q, params, (err, result) => {
            if (err) {
                return callback(new GenericError({
                    err: err,
                    log: "db insert error",
                    metadata: [table, params, q]
                }));
            }
            // if (nou.isNull(result.affectedRows) < 1) {
            //     return callback(new GenericError({
            //         log: "db insert did not return Id properly",
            //         metadata: [table, params, q, result]
            //     }));
            // }
            callback(null, result.insertId);
        })
    }


    update(table, id, params, callback) {
        var q = "update `" + table + "` set ? where `Id` = " + sql.escape(id);
        this.query(q, params, (err, result) => {
            if (err) {
                return callback(new GenericError({
                    err: err,
                    log: "db update error",
                    metadata: [table, id, params, q]
                }));
            }
            if (result.affectedRows < 1) {
                return callback(new ItemNotFoundError("update affectedRows = 0", [table, id, params, q]));
            }
            callback();
        })
    }

    get(query, params, callback) {
        this.query(query, params, (err, result) => {
            if (err) {
                callback(err);
            } else {
                result.forEach((item) => {
                        //dataset.forEach((item) => {
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
                    //});
                callback(null, result);
            }
        });
    }

    getSingle(query, params, callback) {
        this.get(query, params, (err, result) => {
            if (err) {
                callback(err);
            } else {
                if (result.length > 0) {
                    callback(null, result[0]);
                } else {
                    callback(new ItemNotFoundError("db.getSingle item not found", [query, params]));
                }
            }
        })
    }

    getById(table, id, callback) {
        this.getSingle("select * from `" + table + "` where `Id` = ?", [id], callback);
    }


    delete(table, id, callback) {
        this.query("delete from `" + table + "` where `Id` = ?", [id], (err, result) => {
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

    deleteWhere(table, params, callback) {
        var where = params.map(i => "`" + i.name + "` = " + sql.escape(i.value)).join(" AND ")
        this.query("delete from `" + table + "` where " + where, (err, result) => {
            if (err) {
                callback(err);
            } else {
                if (result.rowsAffected < 1) {
                    return callback(new ItemNotFoundError("db deleteWhere not found", [table, params]));
                }
                callback(null, result.rowsAffected);
            }
        });
    }

}

module.exports = Db;