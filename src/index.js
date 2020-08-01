const moment = require('moment');
const express = require('express');
const path = require('path');
const nou = require('nou');
const fs = require('fs');
const bunyan = require('bunyan');
const Ajv = require('ajv');
var emailValidator = require("email-validator");

const ItemNotFoundError = require('./errors/item-not-found-error.js');

const Mailer = require('./modules/mailer.js');
const PasswordPolicy = require('./nodules/password-policy.js');
const calculator = require('./modules/calculator.js');
const Auth = require('./modules/auth.js');
const Db = require('./db.js');

const registerSchema = require('./schemas/register-schema.json');
const matconSchema = require('./schemas/matcon-schema.json');
const reviewSchema = require('./schemas/review-schema.json');
const userSchema = require('./schemas/user-schema.json');

const config = require('./creds.json');


var configuration = {
    "pre-register-expiration-days": 3,
    "expiration-job-hours": 12,
    logger: {
        name: "bread",
        streams: [{
            level: 'debug',
            stream: process.stdout
        }]
    }
}

//override default config from file:
for (let [key, value] of Object.entries(config.main)) {
    configuration[key] = value;
}

var services = {
    emailValidator: emailValidator
}

services.ajv = new Ajv();
services.ajv.addSchema(registerSchema, "register");
services.ajv.addSchema(matconSchema, "matcon");
services.ajv.addSchema(reviewSchema, "review");
services.ajv.addSchema(userSchema, "user");


var logger = bunyan.createLogger(config.logger);
services.logger = logger;
services.db = new Db(config, services);
services.passwordPolicy = new PasswordPolicy(config);
services.mailer = new Mailer(config);
services.auth = new Auth(config, services);

//delete old non verified email registrations
setInterval(() => {
    services.db.deleteExpiredPreRegisters(configuration["pre-register-expiration-days"], (err, deleted) => {
        if (err) {
            if (err instanceof ItemNotFoundError) {
                logger.info("pre-register expiration job ran. no results");
            } else {
                logger.error({
                    err: err
                }, "there was an error in the re-register expiration job");
            }
        } else {
            logger.info("re-register expiration job succesfull. delete " + deleted);
        }
    })
});

var app = express()

var api = express();

var login = express();

app.use("/api", api);
api.use("/identity", login);
app.use(express.static(path.join(__dirname, 'public')));

function timeToStr(t) {
    if (t / 60 >= 1) {
        var s = (t / 60).toFixed(0) + " hours";
        if (t % 60 > 0) {
            s += " and " + t % 60 + " minutes";
        }
        return s;
    }
    return t + " minutes";
}


api.get("/bread", (req, res) => {
    var arr = [];
    for (let [name, b] of Object.entries(matconim)) {
        arr.push({
            "name": name,
            "weight": b.weight,
            "temperature": b.temperature,
            "img": b.img
        })
    }
    res.json(arr);
});

api.get("/bread/:breadType", (req, res) => {
    if (matconim[req.params.breadType]) {
        var b = matconim[req.params.breadType];
        res.json({
            "name": req.params.breadType,
            "weight": b.weight,
            "temperature": b.temperature,
            "img": b.img
        })
    } else {
        res.status(404).end();
    }
});

api.get("/bread/:breadType/times", (req, res) => {
    if (matconim[req.params.breadType]) {
        if (req.query.from == "start") {
            res.json(calculator.calculateTimesFromStart(req.query.time, req.params.breadType));
        } else {
            res.json(calculator.calculateTimesFromEnd(req.query.time, req.params.breadType));
        }
    } else {
        res.status(404).end();
    }
});

api.get("/bread/:breadType/weight", (req, res) => {
    if (matconim[req.params.breadType]) {
        res.json(calculator.caculateAmount(req.query.weight, req.params.breadType));
    } else {
        res.status(404).end();
    }
});

login.get("/login", (req, res) => {
    //todo: check is authenticated
});

login.post("/login", (req, res) => {
    //todo: log in
});

login.post("/logout", (req, res) => {
    //todo: log out
});

login.post("/register", (req, res) => {

});

db.connect((err) => {
    if (err) {
        console.error("Error connecting to db", err);
        process.exit(1);
    }
    app.listen(8080, () => {
        console.log('http server listening');
    })
})