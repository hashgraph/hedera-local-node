/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2023-2024 Hedera Hashgraph, LLC
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
