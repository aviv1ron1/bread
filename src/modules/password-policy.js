const nou = require('nou');

class PasswordPolicy {

    constructor(config) {
        this.minLength = 8;
        this.maxLength = 100;
        this.mustIncludeNumbers = true;
        this.mustIncludeChars = true;
        this.mustIncludeUpperCase = false;
        this.mustIncludeSpecial = false;
        this.maxRepeat = 2;
        if(nou.isNotNull(config) && nou.isNotNull(config["password-policy"])) {
        	for (let [key, value] of Object.entries(config["password-policy"])) {
        		this[key] = value;
        	}
        }
    }

    validate(password, callback) {
        if (password.length < this.minLength) {
            return callback("password must be at least " + this.minLength + " characters");
        }
        if (password.length > this.maxLength) {
            return callback("password must be maximum " + this.maxLength + " characters");
        }
        if (this.mustIncludeNumbers && nou.isNull(password.match(/\d/))) {
            return callback("password must include at least one number");
        }
        if (this.mustIncludeChars && nou.isNull(password.match(/[a-z]/))) {
            return callback("password must include at least one lower case character (a-z)");
        }
        if (this.mustIncludeUpperCase && nou.isNull(password.match(/[A-Z]/))) {
            return callback("password must include at least one upper case character (A-Z)");
        }
        if (this.mustIncludeSpecial && nou.isNull(password.match(/[^A-z\d]/))) {
            return callback("password must include at least one special character (for example ! @ # $)");
        }
        var maxRepeatRegex = new RegExp("(.)\\1{" + this.maxRepeat + ",}")
        if (nou.isNotNull(password.match(maxRepeatRegex))) {
            return callback("password must not include the same character repeating more than " + this.maxRepeat + " times");
        }
        callback(null, true);
    }
}

module.exports = PasswordPolicy