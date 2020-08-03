const GenericError = require('./generic-error.js');

class SchemaValidationError extends GenericError {

	constructor(log, metadata, errors) {
		var status = 400;
		var description = "Item validation failed";
		var errType = "SchemaValidationError";
		super({ log, status, description, metadata, errType });
		this.errors = errors;
	}
}

module.exports = SchemaValidationError;