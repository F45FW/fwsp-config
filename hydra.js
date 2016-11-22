'use strict';

const UMFMessage = require('fwsp-umf-message');
const Logger = require('fwsp-logger');
const EventEmitter = require('events');

/**
 * @name HydraConfig
 * @summary Hydra config helper
 * @fires HydraConfig#HydraConfig.CONFIG_UPDATE_EVENT
 */
class HydraConfig extends EventEmitter {
  /**
   * @param {object} hydra - hydra instance
   * @param {object} options - options
   */
  constructor(hydra, options={}) {
    super();
    this.hydraOptions = Object.assign({
      reconnectRedis: false
    }, options);
    this.hydra = hydra;
    hydra.on('message', msg => this.handleMessage(msg));
    let serviceName = hydra.getServiceName();
    hydra.makeAPIRequest({
      to: `config-service:[GET]/v1/config/${serviceName}/${hydra.serviceVersion}`,
      from: `${serviceName}`,
      body: {}
    })
      .then(response => {
        if (response && response.statusCode === 200 && Object.keys(response.result).length) {
          /**
           * @event HydraConfig#HydraConfig.CONFIG_UPDATE_EVENT
           * @type {object}
           */
          this.emit(HydraConfig.CONFIG_UPDATE_EVENT, response.result);
        }
      });
  }

  /**
   * @return {string} config update event
   * @static
   */
  static get CONFIG_UPDATE_EVENT() {
    return 'configUpdate';
  }

  /**
   * @return {string} update message type
   * @static
   */
  static get UPDATE_MESSAGE_TYPE() {
    return 'configRefresh';
  }

  /**
   * @name setHydraExpress
   * @param {object} hydraExpress - hydra express instance
   * @param {object} options - options
   */
  setHydraExpress(hydraExpress, options={}) {
    this.hydraExpressOptions = Object.assign({
      reconnectLogger: false
    }, options);
    this.on(HydraConfig.CONFIG_UPDATE_EVENT, config => {
      // pull version and registerRoutesCallback, set at service initialization, from existing config
      config.version = hydraExpress.config.version;
      config.registerRoutesCallback = hydraExpress.config.registerRoutesCallback;
      let missing = hydraExpress.validateConfig(config);
      if (missing.length) {
        console.log('Missing required fields: ' + missing.join(', '));
        return;
      }
      hydraExpress.config = config;
      if (this.hydraExpressOptions.reconnectLogger && config.logger) {
        const logger = new Logger({
                name: config.logger.name || config.hydra.serviceName
              },
              config.logger.elasticsearch
            );
        let oldLogger = hydraExpress.logger;
        hydraExpress.logger = logger;
        hydraExpress.appLogger = logger.getLogger();
        console.log('new logger attached');
        if (oldLogger) {
          oldLogger.shutdown(code => {
            console.log('old logger shut down');
          });
        }
      }
    });
  }

  /**
   * @name handleMessage
   * @param {object} msg - message object
   */
  handleMessage(msg) {
    let message = UMFMessage.createMessage(msg);
    if (message.from === 'config-service:/') {
      if (message.type !== HydraConfig.UPDATE_MESSAGE_TYPE) {
        console.log(`Unrecognized message type: ${message.type}`);
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
      if (this.hydraOptions.reconnectRedis) {
        this.hydra.redisdb.once('end', () => {
          console.log('[config] Redis connection closed.');
          this.hydra._connectToRedis(this.hydra.config);
        });
        this.hydra.redisdb.once('ready', () => {
          console.log('[config] Redis reconnected');
        });
        console.log('[config] Requesting redis shutdown...');
        this.hydra.redisdb.quit();
      }
      /**
       * @event HydraConfig#HydraConfig.CONFIG_UPDATE_EVENT
       * @type {object}
       */
      this.emit(HydraConfig.CONFIG_UPDATE_EVENT, message.body.config);
    }
  }
}

module.exports = HydraConfig;
