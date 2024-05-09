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

import { PrivateKey } from '@hashgraph/sdk';

export enum KeyType {
  ED25519 = 'ED25519',
  ECDSA = 'ECDSA',
  DER = 'DER'
}

export interface IPrivateKey {
  value: string;
  type: KeyType;
}

export function getPrivateKey(key: IPrivateKey): PrivateKey {
  switch (key.type) {
    case KeyType.ED25519:
      return PrivateKey.fromStringED25519(key.value);
    case KeyType.ECDSA:
      return PrivateKey.fromStringECDSA(key.value);
    case KeyType.DER:
      return PrivateKey.fromStringDer(key.value);
    default:
      throw new Error(`Unsupported key type: ${key.type}`);
  }
}
