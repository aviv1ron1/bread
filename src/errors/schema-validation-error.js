const GenericError = require('./generic-error.js');

class SchemaValidationError extends GenericError {

	constructor(log, metadata, errors) {
		var status = 400;
		var description = "Item validation failed";
		super({ log, status, description, metadata });
		this.errors = errors;
	}
}

module.exports = SchemaValidationError;