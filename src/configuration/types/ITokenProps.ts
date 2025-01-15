// SPDX-License-Identifier: Apache-2.0

import { IPrivateKey } from './IPrivateKey';

type ICustomFee = import('@hashgraph/proto').proto.ICustomFee;

export interface ITokenProps {
  tokenName: string;
  tokenSymbol: string;
  tokenType: string;
  supplyType: string;
  decimals?: number;
  initialSupply?: number;
  maxSupply?: number;
  mints?: Array<{ CID: string }>;
  treasuryKey?: IPrivateKey;
  adminKey?: IPrivateKey;
  kycKey?: IPrivateKey;
  freezeKey?: IPrivateKey;
  pauseKey?: IPrivateKey;
  wipeKey?: IPrivateKey;
  supplyKey?: IPrivateKey;
  feeScheduleKey?: IPrivateKey;
  freezeDefault?: boolean;
  autoRenewAccountId?: string;
  expirationTime?: string;
  autoRenewPeriod?: number;
  tokenMemo?: string;
  customFees?: ICustomFee[];
}
