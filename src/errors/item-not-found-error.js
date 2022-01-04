const GenericError = require('./generic-error.js');

class ItemNotFoundError extends GenericError {

    constructor(log, metadata) {
        var status = 401;
        var description = "Sorry, item not found";
        var errType = "ItemNotFoundError";
        super({
            log,
            status,
            description,
            metadata,
            errType
        });
    }

}

module.exports = ItemNotFoundError;