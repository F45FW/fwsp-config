# Config

[![Build Status](https://travis-ci.org/flywheelsports/fwsp-config.svg?branch=master)](https://travis-ci.org/flywheelsports/fwsp-config)
[![npm version](https://badge.fury.io/js/fwsp-config.svg)](https://badge.fury.io/js/fwsp-config) <span class="badge-npmdownloads"><a href="https://npmjs.org/package/fwsp-config" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/fwsp-config.svg" alt="NPM downloads" /></a></span> [![npm](https://img.shields.io/npm/l/fwsp-config.svg)]()

A configuration file handler. Config can load configuration files from a local file system or a remote server.

Once the config module is initialized you can access config properties as you would a simple [POJOs](https://www.quora.com/What-is-a-plainObject-in-JavaScript) JavaScript object.

## Examples

**Load a local file**

```javascript
const config = require('fwsp-config');
config.init('properties.json')
  .then(() => {
    console.log(config.aws);  
    console.log(config.hydra.aws.apiVersions);
  });
```

**Load a remote file**

```javascript
const config = require('fwsp-config');
config.init('http://cjus.me/properties.json');
  .then(() => {
    console.log(config.aws);  
    console.log(config.hydra.aws.apiVersions);
  });
```

**Load from an object**

const config = require('fwsp-config');
config.init({
  hydra: {
   serviceName: 'offers-service',
   serviceIP: '',
   servicePort: 7000,
   serviceType: 'offers',
   serviceDescription: 'Phone validation for use with first ride class offers',
   redis: {
     url: 'redis', port: 6379, db: 15
     }
   }
})
  .then(() => {
    console.log(config.hydra);  
  });
```


**Usage**

The `config` module returns a Promise and resolves if it successful loaded and parsed a configuration file, otherwise it rejects.  This allows you to sequence application concerns which require configuration data until after the configuration is loaded.

## Sharing config files

Sometimes multiple instances of a service might share the same configuration file. To support this use-case, `config` allows you to define a local configuration file with a location field that specifies the remote location where a configuration file can be found.

```javascript
{
  "location": "http://services.com/imageprocesser/properties.json"
}
```

## Retrieving a plain JS object

The `config` module behaves like a JavaScript object once it has configuration files loaded. However, for times when you really do what a pure JS object you can use the `getObject()` method:

```javascript
const config = require('fwsp-config');
config.init('properties.json')
  .then(() => {
    let obj = config.getObject();
    console.log(JSON.stringify(obj));
  });
```

## Overriding config properties

Config allows you to use plain JavaScript setter patterns to update a loaded configuration file. This is useful in a shared configuration file scenario where each service loads a config file and needs to override one or more fields.

```javascript
const config = require('fwsp-config');
config.init('properties.json')
  .then(() => {
    config.hydra.serviceName = 'NewServiceName';
    console.log(config.hydra.serviceName);
  });
```

## Implementation details

This `config` module is implemented using [ES6 Proxy support](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) and so it requires NodeJS 6.2.1 or greater [Chrome 49](https://www.chromestatus.com/feature/4811188005240832) or greater.

## Tests

This project has a series of mocha tests in the `specs` folder.

To run them you'll need mocha installed:

```shell
$ npm install mocha -g
```

 then just:

```shell
$ npm run test
```
