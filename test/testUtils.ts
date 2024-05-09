import { PrivateKey } from '@hashgraph/sdk';
import { IPrivateKey, KeyType } from '../src/configuration/types/IPrivateKey';

export function toIPrivateKey(key: PrivateKey): IPrivateKey {
  let keyType: KeyType;
  switch(key.type) {
    case 'ED25519':
      keyType = KeyType.ED25519;
      break;
    case 'secp256k1':
      keyType = KeyType.ECDSA;
      break;
    case 'DER':
      keyType = KeyType.DER;
      break;
    default:
      throw new Error(`Unsupported key type: ${key.type}`);
  }
  return { value: key.toString(), type: keyType };
}
