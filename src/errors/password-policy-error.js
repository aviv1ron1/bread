const GenericError = require('./generic-error.js');

class PasswordPolicyError extends GenericError {

	constructor(error) {
		var status = 400;
		var description = "Password does not meet required password policy. " + error;
		var log = description;
		var errType = "PasswordPolicyError";
		super({ log, status, description, errType });
	}
}

module.exports = PasswordPolicyError;