'use strict';

const Promise = require('bluebird');

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
   setConfig(serviceConfig) {
     super.setConfig(serviceConfig);
     return this._plugin.setConfig(serviceConfig.hydra);
   }
  /**
   * @override
   */
  updateConfig(serviceConfig) {
    let ipChanged = (this.serviceConfig.hydra.serviceIP !== serviceConfig.hydra.serviceIP) ? true : false;
    let portChanged = (this.serviceConfig.hydra.servicePort !== serviceConfig.hydra.servicePort) ? true : false;
    super.updateConfig(serviceConfig);
    //this._plugin.updateConfig(serviceConfig.hydra);
    let hydraExpress = this.hydraExpress;
    // pull version and registerRoutesCallback, set at service initialization, from existing config
    serviceConfig.version = hydraExpress.config.version;
    serviceConfig.registerRoutesCallback = hydraExpress.config.registerRoutesCallback;
    let missing = hydraExpress.validateConfig(serviceConfig);
    if (missing.length) {
      throw(new Error('Missing required fields: ' + missing.join(', ')));
    }
    let hydra = hydraExpress.getHydra();
    hydraExpress.config = serviceConfig;
    hydra.config = serviceConfig.hydra;
    if (ipChanged || portChanged) {
      console.log('IP or port changed, restarting Express server in 2 seconds');
      Promise.delay(2000).then(() => {
        hydraExpress.server.close(() => {
          console.log('Server stopped, restarting');
          hydraExpress.initWorker();
          console.log({
            serviceName: hydra.serviceName,
            serviceIP: hydra.config.serviceIP,
            servicePort: hydra.config.servicePort
          });
        });
      });
    }
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
