[![npm (tag)](https://img.shields.io/npm/v/@hashgraph/hedera-local)](https://www.npmjs.com/package/@hashgraph/hedera-local)

# @hashgraph/hedera-local

Developer tooling for running a Local Hedera Network (Consensus + Mirror Nodes)

## What

This package defines a basic cli commands, that can be executed via node (npx), for interacting with the Local Hedera
Network.

Exposed urls are:
```bash
Consensus Node Url - 127.0.0.1:50211
Node Id - 0.0.3
Mirror Node Url - http://127.0.0.1:5551
```

## Requirements

- [Node.js](https://nodejs.org/) >= v16.x and npm >= v8.5.x
- [Docker](https://www.docker.com/) >= v20.10.x
- [Docker Compose](https://docs.docker.com/compose/) >= v1.25.x

### Note

- Ensure to use Docker Compose version 1.29.2 on macOS, due to known bug in Docker Compose V2.
- Ensure the `gRPC FUSE for file sharing` and `Use Docker Compose V2` settings are disabled in the docker settings.

![docker-compose-settings.png](docker-compose-settings.png)

## Installation

```bash
npm install --save-dev @hashgraph/hedera-local
```

## Using hedera-local

```
$ npx hedera-local

Local Hedera Package - Runs consensus and mirror nodes on localhost:
- consensus node url - 127.0.0.1:50211
- node id - 0.0.3
- mirror node url - http://127.0.0.1:5551

Available commands:
    start - Starts the local hedera network.
    stop - Stops the local hedera network and delete all the existing data.
    restart - Restart the local hedera network.
    generate-accounts <n> - Generates N accounts, default 10. 
```

### Commands

#### `npx hedera-local start <options>`

```bash
$ npx hedera-local start
Starting the docker images...
Starting the pinger...
Generating accounts...
---------- Accounts list:
0.0.1001 - 0x7f109a9e3b0d8ecfba9cc23a3614433ce0fa7ddcc80f2a8f10b222179a5a80d6 - 100000 ℏ
0.0.1002 - 0x6ec1f2e7d126a74a1d2ff9e1c5d90b92378c725e506651ff8bb8616a5c724628 - 100000 ℏ
0.0.1003 - 0xb4d7f7e82f61d81c95985771b8abf518f9328d019c36849d4214b5f995d13814 - 100000 ℏ
0.0.1004 - 0x941536648ac10d5734973e94df413c17809d6cc5e24cd11e947e685acfbd12ae - 100000 ℏ
0.0.1005 - 0x5829cf333ef66b6bdd34950f096cb24e06ef041c5f63e577b4f3362309125863 - 100000 ℏ
0.0.1006 - 0x8fc4bffe2b40b2b7db7fd937736c4575a0925511d7a0a2dfc3274e8c17b41d20 - 100000 ℏ
0.0.1007 - 0xb6c10e2baaeba1fa4a8b73644db4f28f4bf0912cceb6e8959f73bb423c33bd84 - 100000 ℏ
0.0.1008 - 0xfe8875acb38f684b2025d5472445b8e4745705a9e7adc9b0485a05df790df700 - 100000 ℏ
0.0.1009 - 0xbdc6e0a69f2921a78e9af930111334a41d3fab44653c8de0775572c526feea2d - 100000 ℏ
0.0.1010 - 0x3e215c3d2a59626a669ed04ec1700f36c05c9b216e592f58bbfd3d8aa6ea25f9 - 100000 ℏ
---------- Total: 10
```

- --accounts - Default is 10. Specify the number of accounts to generate at startup. The first 10 are with predefined
  private keys, and the next ones are with random generated private keys.

```bash
$ npx hedera-local start --accounts=2
Starting the docker images...
Starting the pinger...
Generating accounts...
---------- Accounts list:
0.0.1001 - 0x7f109a9e3b0d8ecfba9cc23a3614433ce0fa7ddcc80f2a8f10b222179a5a80d6 - 100000 ℏ
0.0.1002 - 0x6ec1f2e7d126a74a1d2ff9e1c5d90b92378c725e506651ff8bb8616a5c724628 - 100000 ℏ
---------- Total: 2
```

---

#### `npx hedera-local stop`

```bash
$ npx hedera-local stop
Stopping the pinger...
Stopping the docker images...
Cleaning the volumes and temp files...
```

No available options

---

#### `npx hedera-local restart <options>`

```bash
$ npx hedera-local restart
Stopping the pinger...
Stopping the docker images...
Cleaning the volumes and temp files...
Starting the docker images...
Starting the pinger...
Generating accounts...
---------- Accounts list:
0.0.1001 - 0x7f109a9e3b0d8ecfba9cc23a3614433ce0fa7ddcc80f2a8f10b222179a5a80d6 - 100000 ℏ
0.0.1002 - 0x6ec1f2e7d126a74a1d2ff9e1c5d90b92378c725e506651ff8bb8616a5c724628 - 100000 ℏ
0.0.1003 - 0xb4d7f7e82f61d81c95985771b8abf518f9328d019c36849d4214b5f995d13814 - 100000 ℏ
0.0.1004 - 0x941536648ac10d5734973e94df413c17809d6cc5e24cd11e947e685acfbd12ae - 100000 ℏ
0.0.1005 - 0x5829cf333ef66b6bdd34950f096cb24e06ef041c5f63e577b4f3362309125863 - 100000 ℏ
0.0.1006 - 0x8fc4bffe2b40b2b7db7fd937736c4575a0925511d7a0a2dfc3274e8c17b41d20 - 100000 ℏ
0.0.1007 - 0xb6c10e2baaeba1fa4a8b73644db4f28f4bf0912cceb6e8959f73bb423c33bd84 - 100000 ℏ
0.0.1008 - 0xfe8875acb38f684b2025d5472445b8e4745705a9e7adc9b0485a05df790df700 - 100000 ℏ
0.0.1009 - 0xbdc6e0a69f2921a78e9af930111334a41d3fab44653c8de0775572c526feea2d - 100000 ℏ
0.0.1010 - 0x3e215c3d2a59626a669ed04ec1700f36c05c9b216e592f58bbfd3d8aa6ea25f9 - 100000 ℏ
---------- Total: 10
```

- --accounts - Default is 10. Specify the number of accounts to generate at startup. The first 10 are with predefined
  private keys, and the next ones are with random generated private keys.

```bash
$ npx hedera-local restart --accounts=2
Stopping the pinger...
Stopping the docker images...
Cleaning the volumes and temp files...
Starting the docker images...
Starting the pinger...
Generating accounts...
---------- Accounts list:
0.0.1001 - 0x7f109a9e3b0d8ecfba9cc23a3614433ce0fa7ddcc80f2a8f10b222179a5a80d6 - 100000 ℏ
0.0.1002 - 0x6ec1f2e7d126a74a1d2ff9e1c5d90b92378c725e506651ff8bb8616a5c724628 - 100000 ℏ
---------- Total: 2
```

---

#### `npx hedera-local generate-accounts <num>`

```bash
$ npx hedera-local generate-accounts 2
---------- Accounts list:
0.0.1003 - 0xfbb758df3a6aab2e0eac205986eebd53b72fa56f659ed9b733772797834b0099 - 100000 ℏ
0.0.1004 - 0x623a5076487903920f3037d5b733d7cf60523cfb726c9aece51df30a0235854e - 100000 ℏ
---------- Total: 2
```

No available options

---

#### You can use it in a hardhat project alongside with [Hardhat Hethers Plugin](https://github.com/LimeChain/hardhat-hethers) by adding the following config:
```bash
defaultNetwork: "localHederaNetwork",
hedera: {
  gasLimit: 300000,
  networks: {
    localHederaNetwork: {
      consensusNodes: [
        {
          url: '127.0.0.1:50211',
          nodeId: '0.0.3'
        }
      ],
      mirrorNodeUrl: 'http://127.0.0.1:5551',
      chainId: 0,
      accounts: [
        {
          "account": '0.0.1001',
          "privateKey": '0x7f109a9e3b0d8ecfba9cc23a3614433ce0fa7ddcc80f2a8f10b222179a5a80d6'
        },
        {
          "account": '0.0.1002',
          "privateKey": '0x6ec1f2e7d126a74a1d2ff9e1c5d90b92378c725e506651ff8bb8616a5c724628'
        },
        {
          "account": '0.0.1003',
          "privateKey": '0xb4d7f7e82f61d81c95985771b8abf518f9328d019c36849d4214b5f995d13814'
        },
        {
          "account": '0.0.1004',
          "privateKey": '0x941536648ac10d5734973e94df413c17809d6cc5e24cd11e947e685acfbd12ae'
        },
        {
          "account": '0.0.1005',
          "privateKey": '0x5829cf333ef66b6bdd34950f096cb24e06ef041c5f63e577b4f3362309125863'
        }
      ]
    }
  }
}
```

---

## How to run a local node with a mirror node and consensus node without the cli wrapper

### Setup

1. Run `docker-compose up -d` from the console.
2. After the run do `docker-compose down -v; git clean -xfd; git reset --hard` to stop and remove the containers, volumes and clean generated files.

### Folder set up
1. `compose-network` folder has the static files needed for starting Local network.
2. `network-logs` folder will be created at runtime and will have all the log files generated after starting local node.

### Steps to change the memory limits and properties
The following environment variables can be changed in the `.env` file for various memory limits
1. Platform
    - PLATFORM_JAVA_HEAP_MIN
    - PLATFORM_JAVA_HEAP_MAX
2. Consensus node
    - NETWORK_NODE_MEM_LIMIT
3. Mirror node
    - MIRROR_GRPC_MEM_LIMIT - memory limit for mirror node gRPC
    - MIRROR_IMPORTER_MEM_LIMIT - memory limit for mirror node importer
    - MIRROR_REST_MEM_LIMIT - memory limit for mirror node rest api
    - MIRROR_WEB3_MEM_LIMIT - memory limit for mirror node web3
4. To change `application.properties`, `api-permission.properties` or `bootstrap.properties` properties, update the `APPLICATION_CONFIG_PATH` to the location of updated config folder in `.env` file

**IMPORTANT :** Ensure to do `docker-compose down -v; git clean -xfd; git reset --hard` and then `docker-compose up -d` for the new changes to take any effect.

&#10008; The keys under `network-node` (`hedera.key`, `hedera.crt` and the `keys` folder) are only intended to be used for testing with this docker based local network. These keys should not be used with any other networks.

## License

Apache 2.0 License
