'use strict';

const fs = require('fs');
const Promise = require('bluebird');
const fetch = require('node-fetch');

class Config {
  constructor() {
    this.config = {};
  }

  /**
  * @name getObject
  * @summary Returns a plain-old JavaScript object
  * @return {object} obj - a Plain old JavaScript Object.
  */
  getObject() {
    return Object.assign({}, this.config);
  }

  /**
  * @name _doInit
  * @summary Perform initialization process.
  * @param {string} configFilePath - path or URL to configuration JSON data
  * @param {function} resolve - resolve function
  * @param {function} reject - reject function
  */
  _doInit(configFilePath, resolve, reject) {
    if (configFilePath.substring(0,4) === 'http') {
      // network based
      this._doInitViaNetwork(configFilePath, resolve, reject);
    } else {
      // file based
      this._doInitViaFile(configFilePath, resolve, reject);
    }
  }

  /**
  * @name _doInitViaFile
  * @summary Perform initialization from a file.
  * @param {string} configFilePath - path to configuration JSON data
  * @param {function} resolve - resolve function
  * @param {function} reject - reject function
  */
  _doInitViaFile(configFilePath, resolve, reject) {
    fs.readFile(configFilePath, (err, result) => {
      if (!err) {
        let config = JSON.parse(result.toString());
        if (config.location) {
          this._doInit(config.location, resolve, reject);
        } else {
          this.config = config;
          resolve();
        }
      } else {
        reject(err);
      }
    });
  }

  /**
  * @name _doInitViaNetwork
  * @summary Perform initialization using remote request.
  * @param {string} configFilePath - URL to configuration JSON data
  * @param {function} resolve - resolve function
  * @param {function} reject - reject function
  */
  _doInitViaNetwork(configFilePath, resolve, reject) {
    let options = {
      headers: {
        'content-type': 'application/json',
        'Accept': 'application/json; charset=UTF-8'
      },
      method: 'GET'
    };
    fetch(configFilePath, options)
      .then((response) => {
        console.log('response.status', response.status);
        return response.json();
      })
      .then((config) => {
        if (config.location) {
          this._doInit(config.location, resolve, reject);
        } else {
          this.config = config;
          resolve();
        }
      })
      .catch((err) => {
        reject(new Error('config file contents is not valid JSON'));
      });
  }

  /**
  * @name init
  * @summary Initializes config object with JSON file data.
  * @param {string} configFilePath - path to config file.
  * @return {object} promise - resolves if successful, else rejects
  */
  init(configFilePath) {
    return new Promise((resolve, reject) => {
      this._doInit(configFilePath, resolve, reject);
    });
  }
}

/**
* Return an ES6 Proxy object which provides access to configuration fields.
*/
module.exports = new Proxy(new Config(), {
  get: function(target, name, receiver) {
    return name in target ?
      target[name] : target.config[name];
  }
});
