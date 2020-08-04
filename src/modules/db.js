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
        this.getById("User", id, callback);
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

    addPreRegister(data, callback) {
        this.insert('PreRegister', [{
            name: "Email",
            type: sql.NVarChar(320),
            value: data.email
        }, {
            name: "Token",
            type: sql.Char(100),
            value: data.token
        }, {
            name: "Timestamp",
            type: sql.DateTime,
            value: data.timestamp
        }, {
            name: "EmailValidated",
            type: sql.Bit,
            value: data.emailValidated
        }], (err, id) => {
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
        this.update("PreRegister", data.id, [{
            name: "Email",
            type: sql.NVarChar(320),
            value: data.email
        }, {
            name: "Token",
            type: sql.Char(100),
            value: data.token
        }, {
            name: "Timestamp",
            type: sql.DateTime,
            value: data.timestamp
        }, {
            name: "EmailValidated",
            type: sql.Bit,
            value: data.emailValidated
        }], (err) => {
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
        this.delete("PreRegister", id, (err, deleted) => {
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
        this.getById("PreRegister", id, callback);
    }

    deleteExpiredPreRegisters(expirationDays, callback) {
        this.execute("DeleteOldPreRegisters", [{
            name: "ExpirationDays",
            type: sql.Int,
            value: expirationDays
        }], [], (err, result) => {
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
        this.insert('UserAuth', [{
            name: "UserId",
            type: sql.Int,
            value: userId
        }, {
            name: "Token",
            type: sql.VarChar(100),
            value: token
        }, {
            name: "Data",
            type: sql.NVarChar,
            value: JSON.stringify(data)
        }], (err, id) => {
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
        this.query("DELETE [UserAuth] FROM [UserAuth] INNER JOIN [User] on [UserAuth].[UserId] = [User].[Id] WHERE [Email] = @email", [{
            name: "Email",
            type: sql.NVarChar,
            value: email
        }], (err, result) => {
            if (err) {
                return callback(new GenericError({
                    log: "db.removeUserAuth: error while deleting",
                    err: err,
                    metadata: [email]
                }));
            }
            callback(null, result.rowsAffected);
        });
    }

    getUserAuth(token, callback) {
        this.getSingle("SELECT [User].* FROM [UserAuth] INNER JOIN [User] ON [UserAuth].[UserId] = [User].[Id] WHERE [Token] = @token", [{
            name: "token",
            type: sql.NVarChar,
            value: token
        }], callback);
    }

    //////matconim ----------------------------------------------------------------

    getMatcon(id, callback) {
        this.execute("GetMatcon", [{
            name: "Id",
            type: sql.Int,
            value: id
        }], [], (err, result) => {
            if (err) {
                return callback(new GenericError({
                    log: "db getMatcon error",
                    err: err,
                    metadata: [id]
                }))
            }
            callback(null, result.recordsets);
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
        this.insert('Matcon', [{
            name: "UserId",
            type: sql.Int,
            value: userId
        }, {
            name: "Name",
            type: sql.NVarChar(200),
            value: name
        }, {
            name: "Rating",
            type: sql.Float,
            value: 0
        }, {
            name: "Data",
            type: sql.NVarChar,
            value: JSON.stringify(matcon)
        }], (err, id) => {
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
        this.update("Matcon", id, [{
            name: "Name",
            type: sql.NVarChar(200),
            value: name
        }, {
            name: "Data",
            type: sql.NVarChar,
            value: JSON.stringify(matcon)
        }], (err) => {
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
        this.delete("Matcon", id, (err, deleted) => {
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
        this.execute("AddReview", [{
            name: "MatconId",
            type: sql.Int,
            value: review.matconId
        }, {
            name: "Rating",
            type: sql.Int,
            value: review.score
        }, {
            name: "UserId",
            type: sql.Int,
            value: review.userId
        }, {
            name: "Data",
            type: sql.NVarChar,
            value: review.content
        }], [], (err, result) => {
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
        this.getById("MatconRating", id, (err, item) => {
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

    deleteReview(id, callback) {
        this.execute("DeleteReview", [{
            name: "Id",
            type: sql.Int,
            value: id
        }], [], (err, result) => {
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
        this.get("SELECT * FROM [MatconRating] WHERE [MatconId] = @MatconId ORDER BY [Timestamp] DESC", [{
            name: "MatconId",
            type: sql.Int,
            value: matconId
        }], (err, results) => {
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
            callback(null, results.recordset);
        })
    }

    getReviewsForUser(userId, callback) {
        this.get("SELECT * FROM [MatconRating] WHERE [UserId] = @UserId ORDER BY [Timestamp] DESC", [{
            name: "UserId",
            type: sql.Int,
            value: userId
        }], (err, results) => {
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
            callback(null, results.recordset);
        })
    }

    //tags ----------------------------------------------------------------------------------

    addMatconTags(matconId, tags, callback) {
        //TODO: add tags
    }

    //TODO: getTags(search, callback)

    //TODO: getPopularTags(callback)


    //basic generic crud --------------------------------------------------------------------

    execute(storedProcedure, inParams, outParams, callback) {
        var self = this;
        var request = new sql.Request();
        inParams.forEach((param) => {
            request.input(param.name, param.type, param.value);
        });
        outParams.forEach((param) => {
            request.output(param.name, param.type);
        });
        request.execute(storedProcedure, (err, result) => {
            if (err) {
                return callback(new GenericError({
                    log: "db execute error",
                    err: err,
                    metadata: [storedProcedure, inParams, outParams]
                }))
            }
            callback(null, result);
        })
    }

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


    update(table, id, params, callback) {
        var q = "update [" + table + "] set " + params.map(i => "[" + i.name + "] = @" + i.name).join(",") + " where [Id] = @id";
        params.push({
            name: "id",
            type: sql.Int,
            value: id
        })
        this.query(q, params, (err, result) => {
            if (err) {
                return callback(new GenericError({
                    err: err,
                    log: "db update error",
                    metadata: [table, id, params, q]
                }));
            }
            if (result.rowsAffected < 1) {
                return callback(new ItemNotFoundError("update rowsAffected = 0", [table, id, params, q]));
            }
            callback();
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

    getById(table, id, callback) {
        this.getSingle("select * from [" + table + "] where Id = @id", [{
            name: "id",
            type: sql.Int,
            value: id
        }], callback);
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

    deleteWhere(table, params, callback) {
        var where = params.map(i => "[" + i.name + "] = @" + i.name).join(" AND ")
        this.query("delete from [" + table + "] where " + where, params, (err, result) => {
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