# How to run a local node with a mirror node and consensus node

### Setup

1. Clone this repository.
2. Run `docker-compose up -d` from the console.
3. After the run do `docker-compose down -v; git clean -xfd; git reset --hard` to stop and remove the containers, volumes and clean generated files.

### Folder set up
1. `compose-network` folder has the static files needed for starting Local network.
2. `network-logs` folder will be created at runtime and will have all the log files generated after starting local node.

### Steps to change the memory limits and properties
1. Memory limits for consensus node can be changed with these settings in `.env` file
   - NETWORK_NODE_MEM_LIMIT 
2. Memory limits for mirror node containers can be changed by modifying the following settings in `.env` file
   - MIRROR_GRPC_MEM_LIMIT - memory limit for mirror node gRPC
   - MIRROR_IMPORTER_MEM_LIMIT - memory limit for mirror node importer
   - MIRROR_REST_MEM_LIMIT - memory limit for mirror node rest api 
   - MIRROR_WEB3_MEM_LIMIT - memory limit for mirror node web3
3. To change `application.properties`, `api-permission.properties` or `bootstrap.properties` properties, update the `APPLICATION_CONFIG_PATH` to the location of updated config folder in `.env` file

**IMPORTANT :** Ensure to do `docker-compose down -v; git clean -xfd; git reset --hard` and then `docker-compose up -d` for the new changes to take any effect.

### NOTE
1. Ensure to use Docker Compose version 1.29.2 on macOS, due to known bug in Docker Compose V2. 
2. Ensure the `gRPC FUSE for file sharing` and `Use Docker Compose V2` settings are disabled in the docker settings.

![docker-compose-settings.png](docker-compose-settings.png)

&#10008; The keys under `network-node` (`hedera.key`, `hedera.crt` and the `keys` folder) are only intended to be used for testing with this docker based local network. These keys should not be used with any other networks. 