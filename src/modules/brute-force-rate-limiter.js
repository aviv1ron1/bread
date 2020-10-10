const nou = require('nou');
const RateLimiterFlexible = require('rate-limiter-flexible');
const BasicModule = require('./basic-module.js');

class BruteForceRateLimiter extends BasicModule {

    constructor(config, services) {
        super("brute-force-rate-limiter", config, services)
        this.init({
            "limiter-type": "RateLimiterMemory",
            "limiter-config": {
                points: 12,
                duration: 86400,
                keyPrefix: 'brute'
            }
        })
        this.limiter = new RateLimiterFlexible[this.config["limiter-type"]](this.config["limiter-config"]);
    }

    getMiddleware() {
        var self = this;
        return (req, res, next) => {
            self.limiter.consume(req.ip)
                .then(() => {
                    next();
                })
                .catch(() => {
                    this.services.logger.warn("brute force rate limiter too many requests", req.ip)
                    res.status(429).send('Too Many Requests');
                });
        }

    }
}

module.exports = IpRateLimiter;