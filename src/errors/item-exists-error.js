const GenericError = require('./generic-error.js');

class ItemExistsError extends GenericError {

    constructor(description, metadata) {
        var status = 409;
        super({
            status,
            description,
            metadata
        });
    }

}

module.exports = ItemExistsError;