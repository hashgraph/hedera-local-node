/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { SafeDockerNetworkRemover } from '../../../src/utils/SafeDockerNetworkRemover';
import { IS_WINDOWS, NETWORK_NAMES } from '../../../src/constants';
import { getTestBed } from '../testBed';
import yaml, {load, loadAll} from 'js-yaml';
import fs, {createReadStream, readdirSync, readFile, readFileSync} from 'fs';
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

  describe('removeByName', () => {
    it('should remove the network when a valid ID is returned', () => {
      shellExecStub
        .withArgs('docker network ls --filter name=hedera-cloud-storage --format "{{.ID}}"')
        .returns({ stderr: '', stdout: '89ded1eca1d5\n' });

      shellExecStub
        .withArgs('docker network rm 89ded1eca1d5 -f 2>null')
        .returns({ stderr: '', stdout: '' });

      SafeDockerNetworkRemover.removeByName('hedera-cloud-storage');

      expect(shellExecStub.calledWith('docker network ls --filter name=hedera-cloud-storage --format "{{.ID}}"')).to.be.true;
      expect(shellExecStub.calledWith(`docker network rm 89ded1eca1d5 -f 2>${IS_WINDOWS ? 'null' : '/dev/null'}`)).to.be.true;
    });

    it('should not attempt to remove network if no valid ID is returned', () => {
      shellExecStub
        .withArgs('docker network ls --filter name=hedera-cloud-storage --format "{{.ID}}"')
        .returns({ stderr: '', stdout: 'invalidID123\n' });

      SafeDockerNetworkRemover.removeByName('hedera-cloud-storage');

      expect(shellExecStub.calledWith('docker network ls --filter name=hedera-cloud-storage --format "{{.ID}}"')).to.be.true;
      expect(shellExecStub.calledWith('docker network rm invalidID123 -f 2>null')).to.be.false;
    });

    it('should handle shell errors gracefully', () => {
      shellExecStub
        .withArgs('docker network ls --filter name=hedera-cloud-storage --format "{{.ID}}"')
        .returns({ stderr: 'some error', stdout: '' });

      SafeDockerNetworkRemover.removeByName('hedera-cloud-storage');

      expect(shellExecStub.calledWith('docker network ls --filter name=hedera-cloud-storage --format "{{.ID}}"')).to.be.true;
      expect(shellExecStub.calledWith('docker network rm 89ded1eca1d5 -f 2>null')).to.be.false;
    });
  });

  describe('removeAll', () => {
    it('should call removeByName for each network', () => {
      const removeByNameStub = sinon.stub(SafeDockerNetworkRemover, 'removeByName');
      SafeDockerNetworkRemover.removeAll();
      expect(removeByNameStub.calledWith('hedera-cloud-storage')).to.be.true;
      removeByNameStub.restore();
    });
    it('check if all of the networks from composer yaml files are listen in the NETWORK_NAMES const', () => {
      const relativePath = '../../..';
      const files = readdirSync(join(__dirname, relativePath)).filter(name => /^docker-compose.*\.yml$/.test(name));
      let actual = [];
      for (const file of files) {
        const data = readFileSync(join(__dirname, `${relativePath}/${file}`));
        const config = load(data.toString());
        actual = [...actual, ...Object.values(config.networks || {}).map((network: any) => network.name.trim())];
      }
      expect([...new Set(actual)].sort().join(',')).to.equal(
        NETWORK_NAMES.sort().join(','),
        `Make sure that no network is missing in NETWORK_NAMES const. It won't be removed by 'npm run stop' otherwise`,
      );
    });
  });
});
