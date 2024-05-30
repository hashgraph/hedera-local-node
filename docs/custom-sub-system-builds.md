# Custom builds  of components


The following guide will provide information on how to build images of the sub systems such as consensus/network node, mirror node importer/rest/grpc and relay.

### Prerequisite

- [Node.js](https://nodejs.org/) `>= v18.x`
  - Node version check: `node -v`
- NPM `>= v10.5.0`
  - NPM version check: `npm -v`
- [Docker](https://www.docker.com/) `>= v20.10.x`
  - Docker version check: `docker -v`
- [Docker Compose](https://docs.docker.com/compose/) `=> v2.12.2`
  - Docker Compose version check: `docker compose version`
- Minimum 16GB RAM


## The Hedera Local Node
To setup Hedera Local Node project using custom images, please first clone the repo:

```
git clone https://github.com/hashgraph/hedera-local-node.git
```

In the following guide we have chosen to use tag `local` for the locally created images. This value should be set in `value` key in `./src/configuration/local.json` for the corresponding image. The example below will set all images to be the one that are locally built:

```
{"key": "NETWORK_NODE_IMAGE_TAG", "value": "local"},
{"key": "HAVEGED_IMAGE_TAG", "value": "local"},
{"key": "MIRROR_IMAGE_TAG", "value": "local"},
{"key": "RELAY_IMAGE_TAG", "value": "local"},
{"key": "MIRROR_NODE_EXPLORER_IMAGE_TAG", "value": "local"}
```

Please review the steps below on how to build each image. When they are created and `local.json` is populated accordingly, you can proceed with running The Hedera Local Node as usual.

## Building Custom images
### Build Consensus/Network node image

  - For building consensus/network image clone `hedera-services` repo:
    ```
    git clone https://github.com/hashgraph/hedera-services.git
    ```

 - Change current directory to `hedera-services` repo:
    ```
    cd hedera-services
    ```

- Please run the following commands:
  ```
  ./gradlew clean
  ./gradlew assemble
  ```

 - Create directory `docker/main-network-node/sdk`:
    ```
    mkdir -p ./hedera-node/infrastructure/docker/containers/local-node/main-network-node/sdk
    ```

 - Copy needed artifacts:
    ```
    cp -r ./hedera-node/data ./hedera-node/infrastructure/docker/containers/local-node/main-network-node/sdk
    ```

 - Build `network-node-base` image:
    ```
    BUILD_PATH="./hedera-node/infrastructure/docker/containers/local-node/network-node-base/"

    docker build -t gcr.io/hedera-registry/network-node-base:local \
      -f $BUILD_PATH/Dockerfile \
      $BUILD_PATH
    ```

 - Build `main-network-node` image:
    ```
    BUILD_PATH="./hedera-node/infrastructure/docker/containers/local-node/main-network-node/"

    docker build --build-arg IMAGE_TAG=local \
      -t gcr.io/hedera-registry/main-network-node:local \
      -f $BUILD_PATH/Dockerfile \
      $BUILD_PATH
    ```

## Build Haveged image
  - For building haveged image clone `hedera-services` repo:

    ```
    git clone https://github.com/hashgraph/hedera-services.git
    ```

 - Change current directory to `hedera-services` repo:

    ```
    cd hedera-services
    ```
  
  - Build `network-node-haveged` image:

    ```
    BUILD_PATH="./hedera-node/infrastructure/docker/containers/local-node/network-node-haveged/"

    docker build \
      -t gcr.io/hedera-registry/network-node-haveged:local \
      -f $BUILD_PATH/Dockerfile \
      $BUILD_PATH
    ```

## Build Mirror node images
  - For building mirror images clone `hedera-mirror-node` repo:
    
    ```
    git clone https://github.com/hashgraph/hedera-mirror-node.git
    ```

  - Change current directory to `hedera-mirror-node` repo:
    
    ```
    cd hedera-mirror-node
    ```

  - Please run the following commands:
    
    ```
    ./gradlew clean
    ./gradlew assemble
    ```

  - Build `hedera-mirror-monitor`, `hedera-mirror-grpc`,`hedera-mirror-web3`,`hedera-mirror-rest`,`hedera-mirror-importer` images:

    ```
  
    docker build -t gcr.io/mirrornode/hedera-mirror-monitor:local -f ./hedera-mirror-monitor/Dockerfile ./hedera-mirror-monitor

    docker build -t gcr.io/mirrornode/hedera-mirror-grpc:local -f ./hedera-mirror-grpc/Dockerfile ./hedera-mirror-grpc

    docker build -t gcr.io/mirrornode/hedera-mirror-web3:local -f ./hedera-mirror-web3/Dockerfile ./hedera-mirror-web3

    docker build -t gcr.io/mirrornode/hedera-mirror-rest:local -f ./hedera-mirror-rest/Dockerfile ./hedera-mirror-rest

    docker build -t gcr.io/mirrornode/hedera-mirror-importer:local -f ./hedera-mirror-importer/Dockerfile ./hedera-mirror-importer
    ```

## Build Relay node image
  - For building relay image clone `hedera-json-rpc-relay` repo:

    ```
    git clone https://github.com/hashgraph/hedera-json-rpc-relay.git
    ```

  - Change current directory to `hedera-json-rpc-relay` repo:

    ```
    cd hedera-json-rpc-relay
    ```

  - Build `hedera-json-rpc-relay` images:

    ```
    docker build -t ghcr.io/hashgraph/hedera-json-rpc-relay:local -f Dockerfile .
    ```

## Build Mirror node Explorer image
  - For building explorer image clone `hedera-mirror-node-explorer` repo:

    ```
    git clone https://github.com/hashgraph/hedera-mirror-node-explorer.git
    ```

  - Change current directory to `hedera-mirror-node-explorer` repo:

    ```
    cd hedera-mirror-node-explorer
    ```

  - Change current directory to `hedera-mirror-node-explorer` repo:

    ```
    cd hedera-mirror-node-explorer
    ```

  - Build `hedera-mirror-node-explorer` images:

    ```
    npm i 
    npm run build
    docker build -t gcr.io/hedera-registry/hedera-mirror-node-explorer:local .
    ```





