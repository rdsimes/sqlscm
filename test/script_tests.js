var assert = require('assert');
var script = require ('../app/script');

describe('script', () => {
  var testConfig = {

  };
  it('should create a script to perform an upgrade to the current revision', (done) => {
      script(testConfig, (err, sql) => {
        assert(sql.length > 0);
        done();
    });
  });
});