const moment = require('moment');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const nou = require('nou');
const fs = require('fs');
const bunyan = require('bunyan');
const bformat = require('bunyan-format')
const Ajv = require('ajv');
const emailValidator = require("email-validator");
const defaults = require('defaults-deep');
const multer = require('multer');
const upload = multer({dest: __dirname + '/uploads'});

const ItemNotFoundError = require('./errors/item-not-found-error.js');
const SchemaValidationError = require('./errors/schema-validation-error.js');

const Mailer = require('./modules/mailer.js');
const PasswordPolicy = require('./modules/password-policy.js');
const calculator = require('./modules/calculator.js');
const Auth = require('./modules/auth.js');
const Db = require('./modules/db.js');
const IpRateLimiter = require('./modules/ip-rate-limiter.js');
const BruteForceRateLimiter = require('./modules/brute-force-rate-limiter.js');

const registerSchema = require('./schemas/register-schema.json');
const matconSchema = require('./schemas/matcon-schema.json');
const reviewSchema = require('./schemas/review-schema.json');
const userSchema = require('./schemas/user-schema.json');
const dbMatconSchema = require('./schemas/db-matcon-schema.json');

var config = require('./config.json');
const creds = require('./creds.json');

config = defaults(config, creds);

var mainDefaultConfiguration = {
    "pre-register-expiration-days": 3,
    "expiration-job-hours": 12,
    logger: {
        name: "bread"
    }
}

//override default config from file:
config.main = defaults(config.main, mainDefaultConfiguration)

var services = {
    emailValidator: emailValidator
}

services.ajv = new Ajv();
services.ajv.addSchema(registerSchema, "register");
services.ajv.addSchema(matconSchema, "matcon");
services.ajv.addSchema(reviewSchema, "review");
services.ajv.addSchema(userSchema, "user");
services.ajv.addSchema(dbMatconSchema, "db-matcon");

var loggerFormat = bformat({
    outputMode: 'short'
});
config.logger.stream = loggerFormat;
var logger = bunyan.createLogger(config.logger);
services.logger = logger;
services.db = new Db(config, services);
services.passwordPolicy = new PasswordPolicy(config, services);
services.mailer = new Mailer(config, services);
services.auth = new Auth(config, services);
var ipRateLimiter = new IpRateLimiter(config, services).getMiddleware();
var bruteForceRateLimiter = new BruteForceRateLimiter(config, services).getMiddleware();

var app = express()
app.use(express.json());
//app.use(ipRateLimiter);
app.use(cookieParser());
app.use(services.auth.xsrfValidate());

var api = express.Router();
api.use((req, res, next) => {
    services.logger.debug("*** express ***", req.method, req.originalUrl, "query:", req.query, "body:", req.body);
    next();
})

var login = express.Router();

app.use("/api", api);
api.use("/identity", login);
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "unpkg.com"],
            "object-src": ["'none'"],
            "style-src": ["'self'", "'unsafe-inline'"],
            upgradeInsecureRequests: [],
        }
    }
}));
app.use(services.auth.xsrf());
app.use(function(err, req, res, next) {
    services.logger.error("*** express ERROR ***", req.method, req.originalUrl, "query:", req.query, "body:", req.body, "error:", err);
    if (res.headersSent) {
        return next(err)
    }
    var status = 500;
    if (err.status) {
        status = err.status;
    }
    var description = "sorry, something went wrong :(";
    if (err.description) {
        description = err.description
    }
    res.status(status).json(description);
})

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

api.post('/upload', upload.single('photo'), (req, res, next) => {
    if(req.file) {
        res.json(req.file);
    }
    else {
        next(new GenericError({
            description: "You must include an image to the request"
        }));
    }
});


api.get("/bread", (req, res) => {
    var arr = [];
    // for (let [name, b] of Object.entries(matconim)) {
    //     arr.push({
    //         "name": name,
    //         "weight": b.weight,
    //         "temperature": b.temperature,
    //         "img": b.img
    //     })
    // }
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

login.get("/login", services.auth.isAuthenticated(), (req, res) => {
    res.status(200).json(req.user);
});

login.post("/login", bruteForceRateLimiter, (req, res, next) => {
    if (nou.isNull(req.body.email) || nou.isNull(req.body.password)) {
        return res.status(400).json("missing required email and password");
    }
    services.auth.login(req.body.email, req.body.password, res, (err, verified, user) => {
        if (err) {
            next(err);
        } else {
            if (verified) {
                res.status(200).json(user);
            } else {
                res.status(401).json("wrong credentials");
            }
        }
    })
});

login.post("/logout", services.auth.isAuthenticated(), (req, res, next) => {
    services.auth.logout(req.user.email, res, (err) => {
        if (err) {
            next(err);
        } else {
            res.status(200).end();
        }
    })
});

login.post("/register", bruteForceRateLimiter, (req, res, next) => {
    if (!services.ajv.validate("register", req.body)) {
        throw new SchemaValidationError("/register: error validating register json schema", [req.body], services.ajv.errors)
    }
    services.auth.register(req.body.email, req.body.name, req.body.password, (err) => {
        if (err) {
            next(err);
        } else {
            res.end("OK")
        }
    })
});

login.get("/verify", bruteForceRateLimiter, (req, res, next) => {
    services.auth.validateRegister(req.query, (err, validationRes) => {
        if (err) {
            console.error("errrrrrr", err);
            next(err);
        } else {
            services.logger.debug("/verify OK", req.query, validationRes);
            res.redirect("#!/verified");
        }
    })
});

services.db.connect((err) => {
    if (err) {
        console.error("Error connecting to db", err);
        process.exit(1);
    }
    app.listen(config.main["port"], () => {
        console.log('http server listening on', config.main["port"]);
        //delete old non verified email registrations
        setInterval(() => {
            services.db.deleteExpiredPreRegisters(config.main["pre-register-expiration-days"], (err, deleted) => {
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
        }, config.main["expiration-job-hours"] * 1000 * 60 * 60);
    })
})