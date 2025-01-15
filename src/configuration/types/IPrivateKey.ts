// SPDX-License-Identifier: Apache-2.0

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
