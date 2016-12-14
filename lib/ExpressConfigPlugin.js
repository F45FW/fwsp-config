'use strict';

const HydraExpressPlugin = require('fwsp-hydra-express/plugin');
const ConfigPlugin = require('./ConfigPlugin');

/**
 * @name ExpressConfigPlugin
 * @summary hydra express plugin for config
 * @extends HydraExpressPlugin
 */
class ExpressConfigPlugin extends HydraExpressPlugin {
  constructor() {
    super('config');
    this._plugin = new ConfigPlugin();
  }
  /**
   * @override
   */
  setHydra(hydra) {
    super.setHydra(hydra);
    this._plugin.setHydra(hydra);
  }
  /**
   * @override
   */
  setHydraExpress(hydraExpress) {
    super.setHydraExpress(hydraExpress);
  }
  /**
   * @override
   */
  updateConfig(serviceConfig) {
    super.updateConfig(serviceConfig);
    //this._plugin.updateConfig(serviceConfig);
    let hydraExpress = this.hydraExpress;
    // pull version and registerRoutesCallback, set at service initialization, from existing config
    serviceConfig.version = hydraExpress.config.version;
    serviceConfig.registerRoutesCallback = hydraExpress.config.registerRoutesCallback;
    let missing = hydraExpress.validateConfig(serviceConfig);
    if (missing.length) {
      throw(new Error('Missing required fields: ' + missing.join(', ')));
    }
    hydraExpress.config = serviceConfig;
  }
  /**
   * @override
   */
  configChanged(opts) {
    this._plugin.configChanged(opts);
  }
  /**
   * @override
   */
  onServiceReady() {
    return this._plugin.onServiceReady();
  }
}

module.exports = ExpressConfigPlugin;
