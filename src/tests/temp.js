const Ajv = require('ajv');
const bunyan = require('bunyan');
const moment = require('moment');

const dbMatconSchema = require('../schemas/db-matcon-schema.json');
const reviewSchema = require('../schemas/review-schema.json');

var logger = bunyan.createLogger({
    name: "asd"
});
var services = {
    logger: logger,
    ajv: new Ajv()
}

services.ajv.addSchema(dbMatconSchema, "db-matcon");
services.ajv.addSchema(reviewSchema, "review");

const Db = require('../modules/db.js');
var db = new Db({
    db: {
        creds: {
            user: "adisadna@e9f5i7jo0n",
            password: "ioppi10!",
            server: "e9f5i7jo0n.database.windows.net",
            database: "bread"
        }
    }
}, services);

var matcon = {
    "name": "50% whole wheat sourdough bread",
    "description": "classical 50% whole wheat sourdough bread",
    "hydration": 0.7,
    "temperature": "250 c",
    "weight": 890,
    "userId": 1,
    "rating": 0,
    "ingredients": [{
        "name": "whole wheat flour",
        "amount": 0.5,
        "type": "flour"
    }, {
        "name": "cafri flour",
        "amount": 0.25,
        "type": "flour"
    }, {
        "name": "strong white flour",
        "amount": 0.25,
        "type": "flour"
    }, {
        "name": "salt",
        "type": "hydration",
        "amount": 0.02
    }, {
        "name": "oil",
        "type": "hydration",
        "amount": 0.025
    }, {
        "name": "water",
        "type": "hydration",
        "calculate": true
    }, {
        "name": "starter",
        "hydration": 0.65,
        "pre": true,
        "ingredients": [{
            "name": "whole wheat flour",
            "type": "flour",
            "amount": {
                "precent": 0.2,
                "from": "whole wheat flour"
            }
        }, {
            "name": "water",
            "calculate": true,
            "type": "hydration"
        }, {
            "name": "madre",
            "amount": 0.33,
            "type": "madre",
            "hydration": 0.65
        }]
    }],
    "times": [{
        "name": "primary kneading",
        "time": 3,
        "description": "flour and water and starter"
    }, {
        "name": "autolyse",
        "time": 40
    }, {
        "name": "main kneading",
        "time": 5,
        "description": "near the end add the salt"
    }, {
        "name": "rest",
        "time": 30
    }, {
        "name": "fold",
        "time": 1
    }, {
        "name": "rest",
        "time": 30
    }, {
        "name": "fold",
        "time": 1
    }, {
        "name": "rest",
        "time": 90
    }, {
        "name": "pre shaping",
        "time": 3
    }, {
        "name": "rest",
        "time": 20
    }, {
        "name": "final shaping",
        "time": 3
    }, {
        "name": "rest",
        "time": 70
    }, {
        "name": "baking",
        "time": 35
    }]
}

var matcon2 = {
    "name": "matcon 2",
    "description": "classical 50% whole wheat sourdough bread",
    "hydration": 0.7,
    "temperature": "250 c",
    "weight": 890,
    "userId": 2,
    "rating": 0,
    "ingredients": [{
        "name": "whole wheat flour",
        "amount": 0.5,
        "type": "flour"
    }, {
        "name": "cafri flour",
        "amount": 0.25,
        "type": "flour"
    }, {
        "name": "strong white flour",
        "amount": 0.25,
        "type": "flour"
    }, {
        "name": "salt",
        "type": "hydration",
        "amount": 0.02
    }, {
        "name": "oil",
        "type": "hydration",
        "amount": 0.025
    }, {
        "name": "water",
        "type": "hydration",
        "calculate": true
    }, {
        "name": "starter",
        "hydration": 0.65,
        "pre": true,
        "ingredients": [{
            "name": "whole wheat flour",
            "type": "flour",
            "amount": {
                "precent": 0.2,
                "from": "whole wheat flour"
            }
        }, {
            "name": "water",
            "calculate": true,
            "type": "hydration"
        }, {
            "name": "madre",
            "amount": 0.33,
            "type": "madre",
            "hydration": 0.65
        }]
    }],
    "times": [{
        "name": "primary kneading",
        "time": 3,
        "description": "flour and water and starter"
    }, {
        "name": "autolyse",
        "time": 40
    }, {
        "name": "main kneading",
        "time": 5,
        "description": "near the end add the salt"
    }, {
        "name": "rest",
        "time": 30
    }, {
        "name": "fold",
        "time": 1
    }, {
        "name": "rest",
        "time": 30
    }, {
        "name": "fold",
        "time": 1
    }, {
        "name": "rest",
        "time": 90
    }, {
        "name": "pre shaping",
        "time": 3
    }, {
        "name": "rest",
        "time": 20
    }, {
        "name": "final shaping",
        "time": 3
    }, {
        "name": "rest",
        "time": 70
    }, {
        "name": "baking",
        "time": 35
    }]
}

db.connect((err) => {
    if (err) {
        logger.error(err);
        process.exit(0);
    }

    db.getReviewsForUser(1, (err, results) => {
        logger.info({ err: err, results: results })
    })

    // db.addReview({
    //     matconId: 3,
    //     score: 5,
    //     userId: 2,
    //     content: ""
    // }, (err) => {
    //     logger.info({ err: err });
    // });

    // db.getReview(8, (err, review) => {
    //     logger.info({
    //         err: err,
    //         review: review
    //     })
    // })

    // db.addUser("b@b.com", { password: "asdasdasd" }, (err, id) => {
    //     logger.info({
    //         err: err,
    //         id: id
    //     }) 
    // }) 


    // db.addMatcon(matcon2, (err, id) => {
    //     logger.info({
    //         err: err,
    //         id: id
    //     })
    // })

    // db.getMatcon(1, (err, data) => {
    // 	logger.info({ err: err, data: data })
    // })

})