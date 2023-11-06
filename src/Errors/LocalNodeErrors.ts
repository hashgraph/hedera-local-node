/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
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

export class LocalNodeErrors extends Error{
    public message: string;
    public name: string;
  
    constructor(name: string, message: string) {
      super();
      this.name = name;
      this.message = message;
    }

    public IS_CONNECTION_ERROR(): boolean {
        return this.name == "Connection Error";
    }

    public CLIENT_ERROR(): boolean {
        return this.name == "Client Error";
    }
}

export const Errors = {
    CONNECTION_ERROR: (port?: number) => new LocalNodeErrors("Connection Error", `Something went wrong, while trying to connect ${port ? `to port ${port}` : `to local node`}`),
    CLEINT_ERROR: (msg?: string) => new LocalNodeErrors("Client Error", `Something went wrong, while trying to create SDK Client${msg ? `: ${msg}` : ``}`)
}
