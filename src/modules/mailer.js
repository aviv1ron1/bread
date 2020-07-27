const GenericError = require('../errors/generic-error.js');
var nodemailer = require('nodemailer');
const nou = require('nou');

class Mailer {

    constructor(config, services) {
        this.test = false;
        if (nou.isNotNull(config) && nou.isNotNull(config.mailer)) {
            for (let [key, value] of Object.entries(config.mailer)) {
                this[key] = value;
            }
        }
        this.mailer = nodemailer.createTransport({
            host: this.host,
            port: this.port,
            auth: {
                user: this.user,
                pass: this.pass
            }
        }, {
            from: this.from
        });
        this.logger = services.logger.child({
            module: "mailer"
        });
    }

    send(mail, callback) {
        var self = this;
        var mailOptions = {
            to: mail.to,
            subject: mail.subject,
            text: mail.content
        }

        if (this.test) {
            callback(null, "test");
        } else {
            this.mailer.sendMail(mailOptions, function(error, info) {
                if (error) {
                    self.logger.error({
                        err: error
                    }, "sendMail: unexpected error");
                    return callback(new GenericError({
                        log: "sendMail: unexpected error",
                        metadata: [mailOptions, info]
                    }));
                }
                callback(null, info);
            });
        }
    }

}

module.exports = Mailer;