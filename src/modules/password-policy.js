const nou = require('nou');
const BasicModule = require('./basic-module.js');

class PasswordPolicy extends BasicModule {

    constructor(config, services) {
        super("password-policy", config, services);
        this.init({
            minLength: 8,
            maxLength: 100,
            mustIncludeNumbers: true,
            mustIncludeChars: true,
            mustIncludeUpperCase: false,
            mustIncludeSpecial: false,
            maxRepeat: 2
        });
    }

    validate(password, callback) {
        if (password.length < this.config.minLength) {
            return callback("password must be at least " + this.config.minLength + " characters");
        }
        if (password.length > this.config.maxLength) {
            return callback("password must be maximum " + this.config.maxLength + " characters");
        }
        if (this.config.mustIncludeNumbers && nou.isNull(password.match(/\d/))) {
            return callback("password must include at least one number");
        }
        if (this.config.mustIncludeChars && nou.isNull(password.match(/[a-z]/))) {
            return callback("password must include at least one lower case character (a-z)");
        }
        if (this.config.mustIncludeUpperCase && nou.isNull(password.match(/[A-Z]/))) {
            return callback("password must include at least one upper case character (A-Z)");
        }
        if (this.config.mustIncludeSpecial && nou.isNull(password.match(/[^A-z\d]/))) {
            return callback("password must include at least one special character (for example ! @ # $)");
        }
        var maxRepeatRegex = new RegExp("(.)\\1{" + this.config.maxRepeat + ",}")
        if (nou.isNotNull(password.match(maxRepeatRegex))) {
            return callback("password must not include the same character repeating more than " + this.config.maxRepeat + " times");
        }
        callback(null, true);
    }
}

module.exports = PasswordPolicy