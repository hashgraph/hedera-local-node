// SPDX-License-Identifier: Apache-2.0

import { join } from 'path';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { APPLICATION_YML_RELATIVE_PATH } from '../constants';

/**
 * Reads the application.yml file and returns its content and path.
 * 
 * @public
 * @returns {{propertiesFilePath: string, application: any}} An object containing the path of the application.yml file and its content.
 */
export default function readApplicationYML() {
    const propertiesFilePath = join(__dirname, APPLICATION_YML_RELATIVE_PATH);
    const application = yaml.load(readFileSync(propertiesFilePath).toString()) as any;

    return {
        propertiesFilePath,
        application
    }
}
