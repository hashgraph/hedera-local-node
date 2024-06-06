# Customizing Local Node Configuration

This document describes how to change the default configurations of the sub systems components.

# Relay configuration

In the file `src/configuration/local.json` you can set the following values for the Relay:

| Envariable variable                            | Description |
| --------                                       | -------     | 
| RELAY_FEE_HISTORY_MAX_RESULTS                  | The maximum number of results to returns as part of `eth_feeHistory`. |
| RELAY_DEFAULT_RATE_LIMIT                       | Default fallback rate limit, if no other is configured. |
| RELAY_MIRROR_NODE_RETRIES                      | The maximum number of retries on a GET request to the mirror node when an acceptable error code is returned. |
| RELAY_MIRROR_NODE_RETRY_DELAY                  | The delay in ms between retry requests. |
| RELAY_TIER_1_RATE_LIMIT                        | Maximum restrictive request count limit used for expensive endpoints rate limiting. |
| RELAY_TIER_2_RATE_LIMIT                        | Maximum moderate request count limit used for non expensive endpoints. |
| RELAY_TIER_3_RATE_LIMIT                        | Maximum relaxed request count limit used for static return endpoints. |
| RELAY_ETH_CALL_DEFAULT_TO_CONSENSUS_NODE       | Flag to set if eth_call logic should first query the mirror node. |
| RELAY_LIMIT_DURATION                           | The maximum duration in ms applied to IP-method based rate limits. |
| RELAY_HBAR_RATE_LIMIT_TINYBAR                  | Total hbar budget in tinybars (110 hbars). |
| RELAY_HBAR_RATE_LIMIT_DURATION                 | hbar budget limit duration. This creates a timestamp, which resets all limits, when it's reached. Default is to 80000 (80 seconds). |
| RELAY_ETH_GET_LOGS_BLOCK_RANGE_LIMIT           | The maximum block number range to consider during an eth_getLogs call. |
| RELAY_WS_CONNECTION_LIMIT_PER_IP               | Maximum amount of connections from a single IP address. |
| RELAY_WS_CONNECTION_LIMIT                      | Maximum amount of concurrent web socket connections allowed. |
| RELAY_WS_MAX_INACTIVITY_TTL                    | Time in ms that the web socket connection is allowed to stay open without any messages sent or received, currently 5 minutes. |
| RELAY_WS_MULTIPLE_ADDRESSES_ENABLED            | If enabled eth_subscribe will allow subscription to multiple contract address. |
| RELAY_WS_SUBSCRIPTION_LIMIT                    | Maximum amount of subscriptions per single connection. |
| RELAY_MIRROR_NODE_GET_CONTRACT_RESULTS_RETRIES | Maximun amount of retries to repeat on `GetContractResults` `contracts/results/` requests when fetching contract results after eth_sendRawTransaction submission. *Note that this in addition and multiplies the configured Axios retries values.    |

# Mirror Node configuration

The configuration file of the Mirror Node is stored in `compose-network/mirror-node/application.yml`

> **_NOTE:_**  Please note that settings below are just the ones present in the Local node's `application.yml` file. For complete reference and default values (including for REST API, REST Java API, Rosetta API, Web3 API) please review: [Mirror Node Configuration](https://github.com/hashgraph/hedera-mirror-node/blob/main/docs/configuration.md)

## Importer

The following table lists the available properties along with their default values.

| Name                                                                             | Default                                              | Description                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hedera.mirror.importer.importHistoricalAccountInfo`                             | true                                                 | Import historical account information that occurred before the last stream reset. Skipped if `startDate` is unset or after 2019-09-14T00:00:10Z.                                                                                                                   |
| `hedera.mirror.importer.parser.record.entity.persist.transactionBytes`           | false                                                | Persist raw transaction bytes to the database                                                                                                                                                                                                                      |
| `hedera.mirror.importer.parser.record.entity.persist.transactionRecordBytes`     | false                                                | Persist raw transaction record bytes to the database                                                                                                                                                                                                               |
| `hedera.mirror.importer.parser.record.entity.redis.enabled`                      | true                                                 | Whether to use Redis to send messages to the gRPC process. Requires `spring.redis.*` [properties](https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-application-properties.html#data-properties)                                             |
| `hedera.mirror.importer.parser.record.sidecar.enabled`                           | false                                                | Whether to download and read sidecar record files                                                                                                                                                                                                                  |
| `hedera.mirror.importer.downloader.accessKey`                                    | ""                                                   | The cloud storage access key                                                                                                                                                                                                                                       |
| `hedera.mirror.importer.downloader.cloudProvider`                                | S3                                                   | The cloud provider to download files from. Either `GCP`, `LOCAL`, or `S3`.                                                                                                                                                                                         |
| `hedera.mirror.importer.downloader.secretKey`                                    | ""                                                   | The cloud storage secret key                                                                                                                                                                                                                                       |
| `hedera.mirror.importer.downloader.bucketName`                                   |                                                      | The cloud storage bucket name to download streamed files. This value takes priority over network hardcoded bucket names regardless of `hedera.mirror.importer.network` value.                                                                                      |
| `hedera.mirror.importer.downloader.endpointOverride`                             |                                                      | Can be specified to download streams from a source other than S3 and GCP. Should be S3 compatible                                                                                                                                                                  |
| `hedera.mirror.importer.initialAddressBook`                                      | ""                                                   | The path to the bootstrap address book used to override the built-in address book                                                                                                                                                                                  |
| `hedera.mirror.importer.network`                                                 | demo                                                 | Which Hedera network to use. Recognized names are `demo`, `mainnet`, `other`, `testnet`, and `previewnet`. Other names are allowed but are treated as development or test networks.                                                                                |
| `hedera.mirror.monitor.publish.scenarios.<name>.type`              |          | The type of transaction to publish. See the [`TransactionType`](/hedera-mirror-monitor/src/main/java/com/hedera/mirror/monitor/publish/transaction/TransactionType.java) enum for a list of possible values |

## GRPC API

The following table lists the available properties along with their default values.

| Name                                                        | Default          | Description                                                                                                                      |
| ----------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `hedera.mirror.grpc.listener.type`                          | REDIS            | The type of listener to use for incoming messages. Accepts either NOTIFY, POLL, REDIS or SHARED_POLL                             |

## Monitor

The following table lists the available properties along with their default values.

| Name                                                               | Default  | Description                                                                                                                                                                                                 |
| ------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hedera.mirror.monitor.mirrorNode.grpc.host`                       | ""       | The hostname of the mirror node's gRPC API                                                                                                                                                                  |
| `hedera.mirror.monitor.mirrorNode.grpc.port`                       | 5600     | The port of the mirror node's gRPC API                                                                                                                                                                      |
| `hedera.mirror.monitor.mirrorNode.rest.host`                       | ""       | The hostname of the mirror node's REST API                                                                                                                                                                  |
| `hedera.mirror.monitor.mirrorNode.rest.port`                       | 443      | The port of the mirror node's REST API                                                                                                                                                                      |
| `hedera.mirror.monitor.publish.scenarios.<name>.properties`        | {}       | Key/value pairs used to configure the [`TransactionSupplier`](/hedera-mirror-monitor/src/main/java/com/hedera/mirror/monitor/publish/transaction) associated with this scenario type                        |
| `hedera.mirror.monitor.publish.scenarios.<name>.receiptPercent`    | 0.0      | The percentage of receipts to retrieve from HAPI. Accepts values between 0-1                                                                                                                                |
| `hedera.mirror.monitor.publish.scenarios.<name>.tps`               | 1.0      | The rate at which transactions will publish                                                                                                                                                                 |
| `hedera.mirror.monitor.subscribe.grpc.<name>.enabled`              | true     | Whether this subscribe scenario is enabled                                                                                                                                                                  |
| `hedera.mirror.monitor.subscribe.rest.<name>.enabled`              | true     | Whether this subscribe scenario is enabled                                                                                                                                                                  |
| `hedera.mirror.monitor.subscribe.rest.<name>.samplePercent`        | 1.0      | The percentage of transactions to verify against the API. Accepts values between 0-1                                                                                                                        |
| `hedera.mirror.monitor.network`                                    | TESTNET  | Which network to connect to. Automatically populates the main node & mirror node endpoints. Can be `MAINNET`, `PREVIEWNET`, `TESTNET` or `OTHER`                                                            |
| `hedera.mirror.monitor.nodes[].accountId`                          | ""       | The main node's account ID                                                                                                                                                                                  |
| `hedera.mirror.monitor.nodes[].host`                               | ""       | The main node's hostname  |
| `hedera.mirror.monitor.operator.accountId`                         | ""       | Operator account ID used to pay for transactions                                                                                                                                                            |
| `hedera.mirror.monitor.operator.privateKey`                        | ""       | Operator ED25519 private key used to sign transactions in hex encoded DER format |
