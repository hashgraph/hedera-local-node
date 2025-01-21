# Requirements

- [Node.js](https://nodejs.org/) `>= v20.11.0`
  - Node version check: `node -v`
- NPM `>= v10.2.4`
  - NPM version check: `npm -v`
- [Docker](https://www.docker.com/) `>= v27.3.1`
  - Docker version check: `docker -v`
- [Docker Compose](https://docs.docker.com/compose/) `=> v2.29.7`
  - Docker Compose version check: `docker compose version`
- Minimum 16GB RAM

### Note:

- Ensure the **VirtioFS** file sharing implementation is enabled in the docker settings

**Note**: The image may look different if you are on a different version
![docker-compose-settings.png](https://raw.githubusercontent.com/hashgraph/hedera-local-node/refs/heads/main/.github/docker-compose-settings.png)

- Ensure the following configurations are set at minimum in Docker **Settings -> Resources** and are available for use.
  - **CPUs:** 6
  - **Memory:** 8 GB
  - **Swap:** 1 GB
  - **Disk Image Size:** 64 GB

**Note**: The image may look different if you are on a different version
![settings.png](https://raw.githubusercontent.com/hashgraph/hedera-local-node/refs/heads/main/.github/settings.png)

- Ensure the hedera-local-node folder is added to Docker File Sharing **Settings -> Resources -> File Sharing**.
  - If you're using hedera-local as npm package - running 'npm root -g' should output the path you have to add under File Sharing Docker's Setting.
  - If you're using hedera-local as cloned repo - running 'pwd' in the project's root should output the path you have to add under File Sharing Docker's Setting.

**Note**: The image may look different if you are on a different version
![docker-file-sharing-settings.png](https://raw.githubusercontent.com/hashgraph/hedera-local-node/refs/heads/main/.github/docker-file-sharing-settings.png)

- Ensure the *Allow the default Docker sockets to be used (requires password)* is enabled in Docker **Settings -> Advanced**.

**Note**: The image may look different if you are on a different version
![docker-socket-setting.png](https://raw.githubusercontent.com/hashgraph/hedera-local-node/refs/heads/main/.github/docker-socket-settings.png)