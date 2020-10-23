const GenericError = require('./generic-error.js');

class SchemaValidationError extends GenericError {

	constructor(log, metadata, errors) {
		var status = 400;
		var errType = "SchemaValidationError";
		errors.splice(0,0,{ message: "Validation failed:"});
		var description = errors.map(i => i.message);
		super({ log, status, description, metadata, errType });
		this.errors = errors;
	}
}

module.exports = SchemaValidationError;