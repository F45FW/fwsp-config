'use strict';

const Promise = require('bluebird');
const UMFMessage = require('fwsp-umf-message');
const HydraPlugin = require('hydra/plugin');
const HydraEvent = require('hydra/events');
const ServerResponse = require('fwsp-server-response');

/**
 * @name ConfigPlugin
 * @summary hydra plugin for config
 * @extends HydraPlugin
 */
class ConfigPlugin extends HydraPlugin {
  constructor() {
    super('config');
  }
  /**
   * @override
   */
  setHydra(hydra) {
    super.setHydra(hydra);
    hydra.on('message', msg => this.handleMessage(msg));
  }
  /**
   * @override
   */
  setConfig(hydraConfig) {
    super.setConfig(hydraConfig);
    if (!this.opts) {
      throw new Error(`'${this.name}' section of config.json is required`);
    }
    this.opts = Object.assign({reconnectRedis: false}, this.opts || {});
  }
  /**
   * @override
   */
  onServiceReady() {
    return new Promise((resolve, reject) => {
      let serviceName = this.hydra.getServiceName();
      let version = this.hydra.serviceVersion;
      console.log(`Making API request for ${serviceName}:${version}`);
      this.hydra.makeAPIRequest({
        to: `config-service:[GET]/v1/config/${serviceName}/${version}`,
        from: `${serviceName}:/`,
        body: {}
      })
        .then(response => {
          if (response && response.statusCode === ServerResponse.HTTP_OK) {
            if (Object.keys(response.result).length) {
              /**
               * @event HydraEvent#HydraEvent.CONFIG_UPDATE_EVENT
               * @type {object}
               */
              this.hydra.emit(HydraEvent.CONFIG_UPDATE_EVENT, response.result);
            } else {
              console.log('No config override available');
            }
            resolve();
          } else {
            reject(new Error('Error getting config'));
          }
        });
    });
  }
  /**
   * @override
   */
  configChanged(opts) {
    this.opts = opts;
  }
  /**
   * @name handleMessage
   * @param {object} msg - message object
   */
  handleMessage(msg) {
    let message = UMFMessage.createMessage(msg);
    if (message.from === 'config-service:/') {
      if (message.type !== HydraEvent.UPDATE_MESSAGE_TYPE) {
        console.log(`Unrecognized message type: ${message.type}`);
        return;
      }

      // ensure versions match
      if (message.body.targetVersion) {
        if (this.hydra.config.serviceVersion === message.body.targetVersion) {
          console.log('Versions matched');
        } else if (message.body.targetVersion === 'all') {
          console.log('Targeting all versions');
        } else {
          console.log(`Config target version ${message.body.targetVersion} != service version ${this.hydra.config.serviceVersion}`);
          return;
        }
      } else {
        console.log('Need to target a version or *');
      }

      // Update hydra config
      this.hydra.config = message.body.config.hydra;

      // reconnect to redis if desired
      // TODO: should remember previous value and check for a change rather than just reconnecting to the same place
      if (this.opts.reconnectRedis) {
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
       * @event HydraEvent#HydraEvent.CONFIG_UPDATE_EVENT
       * @type {object}
       */
      this.hydra.emit(HydraEvent.CONFIG_UPDATE_EVENT, message.body.config);
    }
  }
}

module.exports = ConfigPlugin;
