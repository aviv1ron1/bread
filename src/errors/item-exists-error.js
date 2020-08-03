const GenericError = require('./generic-error.js');

class ItemExistsError extends GenericError {

    constructor(description, metadata) {
        var status = 409;
        var errType = "ItemExistsError";
        super({
            status,
            description,
            metadata,
            errType
        });
    }

}

module.exports = ItemExistsError;