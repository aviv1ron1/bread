const nou = require('nou');

class GenericError {

    constructor({
    	log,
        err = new Error(),
        description = "Sorry :( something went wrong",
        status = 500,
        metadata = [],
        errType = "GenericError"
    } = {}) {
        this.log = log;
        this.error = err;
        this.description = description;
        this.status = status;
        this.metadata = metadata;
        this.errType = errType;
    }

}

module.exports = GenericError;