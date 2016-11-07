var assert = require('assert');
var init = require ('../app/init');

describe('init', () => {
  console.log('X', __dirname);
  describe('getConfig', () => {
    it('should detect git repositories', (done) => {
        init.getConfig(__dirname, (err, config) => {
          assert.equal('git', config.mode);
          done();
        });
    });
  });
});