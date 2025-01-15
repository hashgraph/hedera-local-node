// SPDX-License-Identifier: Apache-2.0

import { IPrivateKey } from './IPrivateKey';

export interface IAccountProps {
  balance: number;
  privateKey?: IPrivateKey;
  associatedTokens?: string[];
}
