'use strict';

const UMFMessage = require('fwsp-umf-message');
const EventEmitter = require('events');

class HydraConfig extends EventEmitter {
  constructor(hydra) {
    super();
    this.hydra = hydra;
    hydra.on('message', msg => this.handleMessage(msg));
    let serviceName = hydra.getServiceName();
    hydra.makeAPIRequest({
      to: `config-service:[GET]/v1/config/${serviceName}/${hydra.serviceVersion}`,
      from: `${serviceName}`,
      body: {}
    })
      .then(result => {
        if (result && result && Object.keys(result).length) {
          this.emit(HydraConfig.CONFIG_UPDATE_EVENT, result);
        }
      });
  }
  static get CONFIG_UPDATE_EVENT() {
    return 'configUpdate';
  }
  static get UPDATE_MESSAGE_TYPE() {
    return 'configRefresh';
  }
  setHydraExpress(hydraExpress) {
    this.on(HydraConfig.CONFIG_UPDATE_EVENT, config => {
      let error = hydraExpress.validateConfig(config);
      if (!error) {
        hydraExpress.config = config;
      } else {
        console.log('Error validating config update', error);
      }
    });
  }
  handleMessage(msg) {
    let message = UMFMessage.createMessage(msg);
    if (message.from === 'config-service:/') {
      if (message.type !== HydraConfig.UPDATE_MESSAGE_TYPE) {
        console.log(`Unrecognized message type: ${message.type}`);
        console.dir(message, {colors:true});
        return;
      }
      if (message.body.targetVersion) {
        if (this.hydra.config.serviceVersion === message.body.targetVersion) {
          console.log('Versions matched');
        } else if (message.body.targetVersion == '*') {
          console.log('Targeting all versions');
        } else {
          console.log(`Config target version ${message.body.targetVersion} != service version ${this.hydra.config.serviceVersion}`);
          return;
        }
      } else {
        console.log('Need to target a version or *');
      }
      this.hydra.config = message.body.config.hydra;
      this.emit(HydraConfig.CONFIG_UPDATE_EVENT, message.body.config);
    }
  }
}

module.exports = HydraConfig;
