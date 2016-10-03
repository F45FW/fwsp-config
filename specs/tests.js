'use strict';

require('./helpers/chai.js');

const config = require('../index.js');

/**
* Change into specs folder so that config loading can find file using relative path.
*/
process.chdir('./specs');

describe('Config init', () => {
  it('should return true when loading a valid json file', (done) => {
    let promise = config.init('properties.json');
    expect(promise).be.fulfilled;
    done();
  });
  it('should return false if cant find json file', (done) => {
    let promise = config.init('xxxproperties.json')
      .catch((err) => {
      });
    expect(promise).be.rejected;
    done();
  });
  it('should return false if invalid json file', (done) => {
    let promise = config.init('invalid-properties.json')
      .catch((err) => {
      });
    expect(promise).be.rejected;
    done();
  });
});

describe('Config field access', () => {
  it('should return a valid field', (done) => {
    let promise = config.init('properties.json');
    promise
      .then(() => {
        expect(config.hydra).to.be.an.object;
        done();
      });
  });
  it('should return a deeply nested field', (done) => {
    return config.init('properties.json')
      .then(() => {
        expect(config.hydra.aws.apiVersions.sqs).to.equal('2012-11-05');
        done();
      });
  });
  it('should return an unassigned value when cant find a field', (done) => {
    return config.init('properties.json')
      .then(() => {
        expect(config.hydra.aws.apiVersions.XXX).to.be.undefined;
        done();
      });
  });
});

describe('Config should support redirection to destination config script', () => {
  it('should return destination config', (done) => {
    return config.init('redirect-test.json')
      .then(() => {
        expect(config.hydra.aws.apiVersions).to.be.an.object;
        done();
      });
  });
});

describe('Config should be loadable via network', () => {
  it('should return success', (done) => {
    config.init('http://cjus.me/properties.json')
      .then(() => {
        done();
      });
  });
  it('should have valid data', (done) => {
    config.init('http://cjus.me/properties.json')
      .then(() => {
        expect(config.hydra.aws.apiVersions).to.be.an.object;
        done();
      });
  });
});

describe('Config should redirect', () => {
  it('should support redirection from local file to network', (done) => {
    return config.init('redirect-network-test.json')
      .then(() => {
        expect(config.hydra.aws.apiVersions).to.be.an.object;
        done();
      });
  });
});

describe('Config overwrite properties', () => {
  it('should allow an field to be replaced', (done) => {
    return config.init('properties.json')
      .then(() => {
        expect(config.hydra.serviceName).to.be.equal('infopath');
        config.hydra.serviceName = 'imageservice';
        expect(config.hydra.serviceName).to.equal('imageservice');
        done();
      });
  });

  it('should allow a field to be added', (done) => {
    return config.init('properties.json')
      .then(() => {
        config.newKey = {
          name: 'newKey',
          value: 'newValue'
        };
        expect(config.newKey).to.be.an.object;
        done();
      });
  });
});

describe('Config should return config object', () => {
  it('should return an object', (done) => {
    config.init('properties.json')
      .then(() => {
        expect(config.getObject()).to.be.an.object;
        done();
      });
  });
});
