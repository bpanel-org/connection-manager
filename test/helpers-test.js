const os = require('os');
const { resolve } = require('path');
const assert = require('assert');
const { Mocha } = require('bmocha');
const Config = require('bcfg');
const fs = require('bfile');
const Blgr = require('blgr');

const mocha = new Mocha(process.stdout);
const {
  loadConfig,
  createClientConfig,
  getConfig,
  deleteConfig,
} = require('../server/helpers');

// setup tmp directory for testing
const testDir = resolve(os.homedir(), '.bpanel_tmp');
process.env.BPANEL_PREFIX = testDir;
process.env.BPANEL_CLIENTS_DIR = 'test_clients';
const { BPANEL_PREFIX, BPANEL_CLIENTS_DIR } = process.env;
const clientsDirPath = resolve(BPANEL_PREFIX, BPANEL_CLIENTS_DIR);

(async () => {
  const code = await mocha.run(() => {
    describe('configHelpers', () => {
      let apiKey, ports, options, id, config, logger;

      before(async () => {
        logger = new Blgr({ level: 'none' });
        id = 'test';
        apiKey = 'foo';
        ports = {
          p2p: 49331,
          node: 49332,
          wallet: 49333,
        };
        await logger.open();
      });

      after(async function() {
        if (fs.existsSync(testDir)) {
          fs.rimrafSync(testDir);
        }
        await logger.close();
      });

      beforeEach(() => {
        config = new Config(id);
        options = {
          id,
          chain: 'bitcoin',
          port: ports.node,
          network: 'regtest',
          apiKey,
          'wallet-port': ports.wallet,
          multisigWallet: false,
        };
      });

      describe('createClientConfig', () => {
        it('should accept options object or a bcfg object', async () => {
          await createClientConfig(id, options, logger);
          config.inject(options);
          await createClientConfig(id, config, logger);
        });

        it('should create new config file in clients directory with correct configs', async () => {
          config.inject(options);
          await createClientConfig(id, options, logger);
          const { BPANEL_PREFIX, BPANEL_CLIENTS_DIR } = process.env;
          const clientPath = resolve(
            BPANEL_PREFIX,
            BPANEL_CLIENTS_DIR,
            `${id}.conf`
          );

          assert(
            fs.existsSync(clientPath),
            'Could not find config file at expected path'
          );

          const loadedConfigs = loadConfig(id, { id, prefix: clientsDirPath });
          loadedConfigs.open(`${id}.conf`);
        });
      });

      describe('deleteConfig', () => {
        it('should remove a config file', async () => {
          await createClientConfig(id, options, logger);
          let config = getConfig(id);
          assert(config, 'Config did not exist before testing deletion');
          deleteConfig(id, logger);
          const path = resolve(config.prefix, `${config.str('id')}.conf`);
          const exists = fs.existsSync(path);
          assert(!exists, 'Config should not exist after deletion');
        });
      });
    });
  });
  process.exit(code);
  // if (code !== 0) process.exit(code);
})();
