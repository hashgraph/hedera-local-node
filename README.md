# How to run a a mirror node with a local services code

### Setup

Clone this repository and initialize submodules:

`git submodule update --init --recursive`

### Start hedera-services

`docker-compose -f services/docker-compose.yml -f docker-compose.override-services.yml up -d`

### Start the mirrornode

`docker-compose -f mirror/docker-compose.yml -f docker-compose.override-mirror.yml up -d`