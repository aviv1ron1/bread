const nou = require('nou');
const RateLimiterFlexible = require('rate-limiter-flexible');
const BasicModule = require('./basic-module.js');

// const rateLimiter = new RateLimiterMemory({
//   points: 200,
//   duration: 60,
//   keyPrefix: 'middleware'
// });


class RateLimiter extends BasicModule {

	constructor(config, services) {
		super("rate-limiter", config, services)
		this.init({
			limiters: [
				{
					"limiter-type": "RateLimiterMemory",
					config: {
						points: 200,
						duration: 60,
						keyPrefix: 'middleware'
					}
				}
			]
		})
	}
}

// var rl = (req, res, next) => {
//   rateLimiter.consume(req.ip)
//     .then(() => {
//       next();
//     })
//     .catch(() => {
//       res.status(429).send('Too Many Requests');
//     });
// };

module.exports = RateLimiter;