const nou = require('nou');
var defaults = require('defaults-deep');


class BasicModule {

	constructor(moduleName, config, services) {
		this.services = services;
		this.config = config[moduleName];
		this.moduleName = moduleName;
		this.logger = services.logger.child({
            module: moduleName
        });
	}

	init(defaultConfig) {
		if (nou.isNotNull(defaultConfig) && nou.isNotNull(defaultConfig)) {
            this.config = defaults(this.config, defaultConfig);
        }
        this.logger.debug(this.moduleName  + " initialized", this.config);
	}
	
}

module.exports = BasicModule;