const GenericError = require('./generic-error.js');

class PasswordPolicyError extends GenericError {

	constructor(error) {
		var status = 400;
		var description = "Password does not meet required password policy. " + error;
		var log = description;
		super({ log, status, description });
	}
}

module.exports = SchemaValidationError;