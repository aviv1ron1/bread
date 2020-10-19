const nou = require('nou');
const RateLimiterFlexible = require('rate-limiter-flexible');
const BasicModule = require('./basic-module.js');

class IpRateLimiter extends BasicModule {

    constructor(config, services) {
        super("ip-rate-limiter", config, services)
        this.init({
            "limiter-type": "RateLimiterMemory",
            "limiter-config": {
                points: 200,
                duration: 60,
                keyPrefix: 'ip'
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
                    this.services.logger.warn("ip rate limiter too many requests", req.ip)
                    res.status(429).end('Too Many Requests');
                });
        }

    }
}

module.exports = IpRateLimiter;