var nodemailer = require('nodemailer');
const nou = require('nou');
var defaults = require('defaults-deep');
const BasicModule = require('./basic-module.js');
const GenericError = require('../errors/generic-error.js');

class Mailer extends BasicModule {

    constructor(config, services) {
        super("mailer", config, services);
        this.init({
            test: true
        })
        this.mailer = nodemailer.createTransport({
            host: this.config.host,
            port: this.config.port,
            auth: {
                user: this.config.user,
                pass: this.config.pass
            }
        }, {
            from: this.config.from
        });
    }

    send(mail, callback) {
        var self = this;
        var mailOptions = {
            to: mail.to,
            subject: mail.subject,
            text: mail.content
        }

        if (this.config.test) {
            callback(null, "test");
        } else {
            self.logger.debug("sending mail", mailOptions);
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