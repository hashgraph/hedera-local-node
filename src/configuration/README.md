# Local Node Environment Setup

This guide will help you set up a local-node environment with initial resources that are auto-created on startup using the `initialResources.json` file.

This allows you to have a pre-configured environment ready for use as soon as the local node starts.

## 1. Introduction

The `initialResources.json` file is a configuration file that defines the initial resources to be created when the local node environment starts up. These resources can include various entities like accounts, tokens, files, etc.

To use the `initialResources.json` file, follow these steps:

1. Locate the `initialResources.json` file in the `./src/configuration` directory.
2. Open the file in a text editor. You will see a JSON object where each key represents a type of resource (e.g., "accounts", "tokens"), and the value is an array of objects, each representing a resource to be created.
3. Modify the file to include the resources you want to be created on startup. Ensure that the JSON syntax is correct (as described below).
4. Save the file and restart the local node environment passing the argument `--createInitialResources=true`. 
5. The resources from the JSON file will be auto-created on startup by the `ResourceCreationState`.

## 2. Resource Creation State

The `ResourceCreationState` manages the state of resource creation during the startup of the local node environment. It uses the `initialResources.json` file to determine which resources need to be created.

When the local node environment starts, if the `createInitialResources` is set to `true` the `ResourceCreationState` will initiate the creation of the specified resources.

Please note that changes to the `initialResources.json` file will only take effect after restarting the local node environment.

## 3. How to Configure `initialResources.json`

### 3.1. Accounts

Here's an example of how to specify an account:

```json
{
  "balance": 1000,
  "privateKey": {
    "value": "0xbc6340d8b24bc70cd8826e43a8cce477756a7c0456a438c6cafab1fdacc0e647",
    "type": "ECDSA"
  },
  "associatedTokens": [
    "TestNFT",
    "TestFT"
  ]
}
```

For each account to be created, you need to specify the following fields:

- **`balance`**: The initial balance of the account in tinybars. This should be a number.
- **`privateKey?`**: A unique private key for the account. This should be an object with the fields:
  - **`value`**: The value of the private key. This should be a string.
  - **`type`**: The type of the private key. This should be a string. Possible types are `"ECDSA"`, `"ED25519"`, and `"DER"`.
- **`associatedTokens?`**: An array of token symbols that the account is associated with. This should be an array of strings.

Edge cases to consider:

- If you don't specify `initialBalance`, the account will be created with a `balance` of `0`.
- If you don't specify `privateKey`, a random `"ECDSA"` private key will be generated for the account. It will be printed in the logs.
- If you don't specify `associatedTokens`, the account will not be associated with any tokens on start of the local node.

_For more details on the account fields, please refer to the `IAccountProps` interface and the `AccountUtils` class._

### 3.2. Tokens

Here's an example of how to specify an NFT token:

```json
{
  "tokenName": "Random NFT Token",
  "tokenSymbol": "RNFT",
  "decimals": 0,
  "maxSupply": 1000,
  "supplyKey": {
    "value": "0xbc6340d8b24bc70cd8826e43a8cce477756a7c0456a438c6cafab1fdacc0e647",
    "type": "ECDSA"
  },
  "mints": [
    {
      "CID": "QmNPCiNA3Dsu3K5FxDPMG5Q3fZRwVTg14EXA92uqEeSRXn"
    },
    {
      "CID": "QmZ4dgAgt8owvnULxnKxNe8YqpavtVCXmc1Lt2XajFpJs9"
    }
  ],
  "tokenMemo": "Random NFT token",
  "tokenType": "NON_FUNGIBLE_UNIQUE",
  "supplyType": "FINITE"
}
```

For each token to be created, you need to specify the following fields:

- **`tokenName`**: The name of the token. This should be a string.
- **`tokenSymbol`**: The symbol of the token. This should be a string.
- **`tokenType`**: The type of the token. This should be a string. Possible types are `"NON_FUNGIBLE_UNIQUE"`/`"FUNGIBLE_COMMON"`.
- **`supplyType`**: The supply type of the token. This should be a string. Possible types are `"FINITE"`/`"INFINITE"`.
- **`decimals?`**: The number of decimal places for the token. This should be a number.
- **`initialSupply?`**: The initial supply of the token. This should be a number.
- **`maxSupply?`**: The maximum supply of the token. This should be a number.
- **`mints?`**: An array of objects representing the mints of the token. Each object should have the fields:
  - **`CID`**: Specifies the content ID of the mint file.
- **`treasuryKey?`**: A private key for the treasury account of the token. This should be an object with the fields:
  - **`value`**: The value of the private key. This should be a string.
  - **`type`**: The type of the private key. This should be one of `"ECDSA"`, `"ED25519"`, and `"DER"`.
- **`supplyKey?`**: A private key for the supply account of the token. This should be an object with the fields:
  - **`value`**: The value of the private key. This should be a string.
  - **`type`**: The type of the private key. This should be one of `"ECDSA"`, `"ED25519"`, and `"DER"`.
- **`adminKey?`**: A private key for the admin account of the token. This should be an object with the fields:
  - **`value`**: The value of the private key. This should be a string.
  - **`type`**: The type of the private key. TThis should be one of `"ECDSA"`, `"ED25519"`, and `"DER"`.
- **`kycKey?`**: A private key for the KYC account of the token. This should be an object with the fields:
  - **`value`**: The value of the private key. This should be a string.
  - **`type`**: The type of the private key. This should be one of `"ECDSA"`, `"ED25519"`, and `"DER"`.
- **`freezeKey?`**: A private key for the freeze account of the token. This should be an object with the fields:
  - **`value`**: The value of the private key. This should be a string.
  - **`type`**: The type of the private key. This should be one of `"ECDSA"`, `"ED25519"`, and `"DER"`.
- **`pauseKey?`**: A private key for the pause account of the token. This should be an object with the fields:
  - **`value`**: The value of the private key. This should be a string.
  - **`type`**: The type of the private key. This should be one of `"ECDSA"`, `"ED25519"`, and `"DER"`.
- **`wipeKey?`**: A private key for the wipe account of the token. This should be an object with the fields:
  - **`value`**: The value of the private key. This should be a string.
  - **`type`**: The type of the private key. This should be one of `"ECDSA"`, `"ED25519"`, and `"DER"`.
- **`feeScheduleKey?`**: A private key for the fee schedule account of the token. This should be an object with the fields:
  - **`value`**: The value of the private key. This should be a string.
  - **`type`**: The type of the private key. This should be one of `"ECDSA"`, `"ED25519"`, and `"DER"`.
- **`freezeDefault?`**: A boolean value indicating whether the token is frozen by default. This should be a boolean.
- **`autoRenewAccountId?`**: The account ID that will pay for the auto-renewal of the token. This should be a string.
- **`expirationTime?`**: The expiration time of the token. This should be a string in the format `YYYY-MM-DDTHH:MM:SS`.
- **`autoRenewPeriod?`**: The auto-renewal period of the token in seconds. This should be a number `>=2_592_000` (>= 30 days) and `<=8_000_000` (<= 3 months).
- **`tokenMemo?`**: A memo for the token. This should be a string.
- **`customFees?`**: An array of custom fees for the token. Each custom fee should be an object with the fields:
  - **One of**:
    - **`fixedFee`**: The fixed fee to be charged. This should be an object with the fields:
      - **`amount`**: The amount of units to assess as a fixed fee. This should be a number.
      - **`denominatingTokenId?`**: The token ID denominating the fee; taken as hbar if left unset and, in a TokenCreate, taken as the id of the newly created token if set to the sentinel value of 0.0.0
    - **`fractionalFee`**: The fractional fee to be charged. This should be an object with the fields:
      - **`fractionalAmount?`**: The fractional amount of the fee. This should be an object with the fields:
        - **`numerator`**: The numerator of the fractional fee. This should be a number.
        - **`denominator`**: The denominator of the fractional fee. This should be a number.
      - **`minimumAmount`**: The minimum amount of the fee. This should be a number.
      - **`maximumAmount`**: The maximum amount of the fee. This should be a number.
      - **`netOfTransfers`**: A boolean value indicating whether the fee is net of transfers. 
        - **`true`**: assesses the fee to the sender, so the receiver gets the full amount from the token transfer list, and the sender is charged an additional fee; 
        - **`false`**: the receiver does NOT get the full amount, but only what is left over after paying the fractional fee
    - **`royaltyFee`**: The royalty fee to be charged. This should be an object with the fields:
      - **`exchangeValueFraction?`**: The fraction of the exchange value to be charged as a royalty fee. This should be an object with the fields:
        - **`numerator`**: The numerator of the fractional fee. This should be a number.
        - **`denominator`**: The denominator of the fractional fee. This should be a number.
      - **`fallbackFee?`**: If present, the fixed fee to assess to the NFT receiver when no fungible value is exchanged with the sender. This should be an object with the fields:
        - `amount`: The amount of units to assess as a fixed fee. This should be a number.
        - `denominatingTokenId?`: The token ID denominating the fee; taken as hbar if left unset and, in a TokenCreate, taken as the id of the newly created token if set to the sentinel value of 0.0.0
  - **`feeCollectorAccountId?`**: The account ID that will collect the custom fee. This should be an object with the fields:
    - **`shardNum`**: The shard number (non-negative).
    - **`realmNum`**: The realm number (non-negative).
    - **`accountNum`**: An account number unique within its realm (non-negative).
   - **`allCollectorsAreExempt?`**: A boolean value indicating whether all collectors are exempt from the custom fee:
     - **`true`**: exempts all the token's fee collection accounts from this fee.
     - **`false`**: does not exempt the token's fee collection accounts from this fee. 
     - The token's `treasuryAccountId` and the above `feeCollectorAccountId` will always be exempt. Please see [HIP-573](https://hips.hedera.com/hip/hip-573) for details.

Edge cases to consider:
- **`supplyKey`**:
  - if not specified, the `ResourceCreationState` will use the operator account as the supply account of the token.
- **`treasuryKey`**:
  - if not specified, the `ResourceCreationState` will use the operator account as the treasury account of the token.
- **`initialSupply`**: 
  - if the `tokenType` is `NON_FUNGIBLE_UNIQUE`, the `initialSupply` field **must** be unspecified or set to `0`.
  - if the `tokenType` is `FUNGIBLE_COMMON`, the `initialSupply` field **must** be provided.
- **`maxSupply`**:
  - if the `supplyType` is `FINITE`, the `maxSupply` **must** be provided.
  - if the `supplyType` is `INFINITE`, the `maxSupply` field **must** be unspecified.
- **`decimals`**: 
  - if the `tokenType` is `NON_FUNGIBLE_UNIQUE`, the `decimals` field **must** be unspecified or set to `0`.
  - if the `tokenType` is `FUNGIBLE_COMMON`, the `decimals` field **must** be provided.
- **`mints`**:
  - if the `tokenType` is `NON_FUNGIBLE_UNIQUE`, the `mints` array can be provided.
  - if the `tokenType` is `FUNGIBLE_COMMON`, the `mints` array is ignored.

_For more details on the token fields, please refer to the `ITokenProps` interface and the `TokenUtils` class._
