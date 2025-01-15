// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import sinon from 'sinon';
import { SafeDockerNetworkRemover } from '../../../src/utils/SafeDockerNetworkRemover';
import { IS_WINDOWS, NETWORK_PREFIX } from '../../../src/constants';
import { getTestBed } from '../testBed';
import { load } from 'js-yaml';
import { readdirSync, readFileSync } from 'fs';
import { join } from "path";

describe('SafeDockerNetworkRemover', () => {
  let shellExecStub: sinon.SinonStub;

  before(() => {
    let {
      shellStubs
    } = getTestBed({
      workDir: 'testDir',
    });

    shellExecStub = shellStubs.shellExecStub;
  });

  after(() => {
    shellExecStub.restore();
  });

  describe('removeByName', () => {
    it('should not proceed if docker network ls command fails', () => {
      shellExecStub.withArgs(`docker network ls --filter name=${NETWORK_PREFIX} --format "{{.ID}}"`).returns({ stderr: 'error' });

      SafeDockerNetworkRemover.removeAll();
      expect(shellExecStub.calledOnce).to.be.true;
      expect(shellExecStub.calledWith(`docker network ls --filter name=${NETWORK_PREFIX} --format "{{.ID}}"`)).to.be.true;
    });

    it('should not proceed if docker network ls command returns no result', () => {
      shellExecStub.withArgs(`docker network ls --filter name=${NETWORK_PREFIX} --format "{{.ID}}"`).returns({ stdout: '', stderr: '' });

      SafeDockerNetworkRemover.removeAll();
      expect(shellExecStub.calledWith(`docker network ls --filter name=${NETWORK_PREFIX} --format "{{.ID}}"`)).to.be.true;
    });

    it('should remove valid Docker network IDs', () => {
      shellExecStub.withArgs(`docker network ls --filter name=${NETWORK_PREFIX} --format "{{.ID}}"`).returns({ stdout: '89ded1eca1d5\ninvalidID123\n', stderr: '' });
      shellExecStub.withArgs(`docker network rm 89ded1eca1d5 -f 2>${IS_WINDOWS ? 'null' : '/dev/null'}`).returns({});

      SafeDockerNetworkRemover.removeAll();
      expect(shellExecStub.calledWith(`docker network rm 89ded1eca1d5 -f 2>${IS_WINDOWS ? 'null' : '/dev/null'}`)).to.be.true;
    });

    it('should not remove invalid Docker network IDs', () => {
      shellExecStub.withArgs(`docker network ls --filter name=${NETWORK_PREFIX} --format "{{.ID}}"`).returns({ stdout: 'invalidID123\nanotherInvalid\n', stderr: '' });

      SafeDockerNetworkRemover.removeAll();
      expect(shellExecStub.calledWith(`docker network rm invalidID123 -f 2>${IS_WINDOWS ? 'null' : '/dev/null'}`)).to.be.false;
      expect(shellExecStub.calledWith(`docker network rm anotherInvalid -f 2>${IS_WINDOWS ? 'null' : '/dev/null'}`)).to.be.false;
    });
  });

  describe('config check', () => {
    it('check if all of the networks from composer yaml files are listed in the NETWORK_NAMES const', () => {
      const relativePath = '../../..';
      const files = readdirSync(join(__dirname, relativePath)).filter(name => /^docker-compose.*\.yml$/.test(name));
      for (const file of files) {
        const data = readFileSync(join(__dirname, `${relativePath}/${file}`));
        const config = load(data.toString());
        for (const network of Object.values(config.networks || {}).map((network: any) => network.name.trim())) {
          expect(network.startsWith(NETWORK_PREFIX), `Network '${network}' does not start with the prefix '${NETWORK_PREFIX}'. It won't be removed by 'npm run stop'`).to.be.true;
        }
      }
    });
    it('check if all services have a network set and all network names start with "hedera-"', () => {
      const relativePath = '../../..';
      const files = readdirSync(join(__dirname, relativePath)).filter(name => /^docker-compose(?!.*(evm|multinode)\.yml$).*\.yml$/.test(name));
      for (const file of files) {
        const data = readFileSync(join(__dirname, `${relativePath}/${file}`));
        const config = load(data.toString());
        const services = config.services || {};
        for (const [serviceName, serviceConfig] of Object.entries(services)) {
          if (serviceConfig.extends || (serviceConfig.network_mode || '' === 'none')) {
            continue; // The child service might have inherited the network. There is no network in non-network mode.
          }
          const networks = serviceConfig.networks;
          expect(networks, `Service '${serviceName}' does not have a network set.`).to.exist;
        }
      }
    });
  });
});
