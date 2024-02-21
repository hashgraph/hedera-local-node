# Environment variables

### Image Names & Prefixes

The following variables control the docker registries for the containers.

- `HAVEGED_IMAGE_PREFIX`: The registry address for the Haveged image
- `NETWORK_NODE_IMAGE_PREFIX`: The registry address for the Consensus node image
- `NETWORK_NODE_IMAGE_NAME`: The name of the Consensus node image
- `UPLOADER_IMAGE_PREFIX`: The registry address for the Uploader image
- `MIRROR_IMAGE_PREFIX`: The registry address for the Mirror node image
- `RELAY_IMAGE_PREFIX`: The registry address for the JSON-RPC relay image
- `MIRROR_POSTGRES_IMAGE`: The name of the postgres image
- `ENVOY_IMAGE_PREFIX`: The registry address for the Envoy image

### Image Tags/Hashes

The following variables control the versions of the containers.

- `NETWORK_NODE_IMAGE_TAG`
- `HAVEGED_IMAGE_TAG`
- `UPLOADER_IMAGE_TAG`
- `MIRROR_IMAGE_TAG`
- `RELAY_IMAGE_TAG`
- `ENVOY_IMAGE_TAG`

### Java Process Settings

JAVA settings for the Consensus node

- `PLATFORM_JAVA_HEAP_MIN`
- `PLATFORM_JAVA_HEAP_MAX`
- `PLATFORM_JAVA_OPTS`

### Bind Mount Settings

- `NETWORK_NODE_LOGS_ROOT_PATH`: Root path of logs directory for Consensus node
- `APPLICATION_ROOT_PATH`
- `APPLICATION_CONFIG_PATH`: Path to Consensus node configuration files

### Memory Limits

- `NETWORK_NODE_MEM_LIMIT`
- `MIRROR_GRPC_MEM_LIMIT`
- `MIRROR_IMPORTER_MEM_LIMIT`
- `MIRROR_REST_MEM_LIMIT`
- `MIRROR_WEB3_MEM_LIMIT`
- `MIRROR_MONITOR_MEM_LIMIT`
- `RELAY_MEM_LIMIT`

### Uploader settings

- `PYTHON_VERSION`: Python version for the Uploader image

### MINIO settings

- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`

### JSON RPC Relay settings

- `RELAY_HEDERA_NETWORK`: Network configuration string in JSON format
- `RELAY_OPERATOR_ID_MAIN`: The operator account id
- `RELAY_OPERATOR_KEY_MAIN`: The private key of the operator
- `RELAY_CHAIN_ID`: Chain id in hex format. Default is 0x12a (298)
- `RELAY_MIRROR_NODE_URL`: The Mirror node url to be used by the relay
- `RELAY_LOCAL_NODE`: Should the relay work in `local` mode
- `RELAY_SERVER_PORT`: The port on which to run the relay
- `RELAY_E2E_HOST`: The full relay url address
- `FEE_HISTORY_MAX_RESULTS`: Max number of results returned by `eth_feeHistory`. Defaults to 10.
- `DEFAULT_RATE_LIMIT`: Default fallback rate limit, if no other is configured. Default is to `200` (200 request per IP).
- `MIRROR_NODE_RETRIES`: Default mirror node retries, if no other is configured. Default is set to `10` for local and `3` for mainnet/testnet/previewnet.
- `MIRROR_NODE_RETRY_DELAY`: Default mirror node retry delay, if no other is configured. Default is set to `150ms` for local and `500ms` for mainnet/testnet/previewnet.
- `TIER_1_RATE_LIMIT`: Restrictive limiting tier, for expensive endpoints. Default is to `100` (100 request per IP).
- `TIER_2_RATE_LIMIT`: Moderate limiting tier, for non expensive endpoints. Default is to `200` (200 request per IP).
- `TIER_3_RATE_LIMIT`: Relaxed limiting tier. Default is to `400` (400 request per IP).
- `LIMIT_DURATION`: Reset limit duration in ms. This creates a timestamp, which resets all limits, when it's reached. Default is to `60000` (1 minute).
- `HBAR_LIMIT_TOTAL_TINYBAR`: Total hbar budget in tinybars. Default is to `5000_000_000` (50 HBAR).
- `BAR_RATE_LIMIT_DURATION`: Hbar limit duration in ms. This creates a timestamp, which resets all limits, when it's reached. Defaults to `60000` (1 minute).
- `ETH_GET_LOGS_BLOCK_RANGE_LIMIT`: `eth_getLogs` fromBlock - toBlock range limit. Defaults to 1000 blocks.
- `RELAY_RATE_LIMIT_DISABLED`: If set to `true` the relay will not perform any rate limiting.
- `RELAY_INPUT_SIZE_LIMIT`: The function input size limit in mb. Defaults to 1.
- `DEV_MODE`: Allows the asserting of contract call revert messages
- `MIRROR_NODE_GET_CONTRACT_RESULTS_RETRIES`: Number of retries for `contracts/results/` endpoint. Defaults to 20

### JSON RPC Relay Websocket settings

- `RELAY_WS_CONNECTION_LIMIT_PER_IP`: Limit of active connections per IP
- `RELAY_WS_CONNECTION_LIMIT`: Global limit of active connections
- `RELAY_WS_MAX_INACTIVITY_TTL`: Time in ms before a connection is terminated
- `RELAY_WS_MULTIPLE_ADDRESSES_ENABLED`: Flag for allowing subscribing to multiple contract addresses in a single subscription
- `RELAY_WS_SUBSCRIPTION_LIMIT`: Maximum allowed subscriptions per single connection

### Record Stream Uploader settings

- `STREAM_EXTENSION`: File extension for record files

### Mirror Node Explorer

- `DOCKER_LOCAL_MIRROR_NODE_MENU_NAME`: Name of the custom network.
- `DOCKER_LOCAL_MIRROR_NODE_URL`: URL for the mirror node endpoint on custom network.