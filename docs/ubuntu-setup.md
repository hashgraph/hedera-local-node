
# Ubuntu setup instructions 

---
**NOTE**

Please first review the main [README](https://github.com/hashgraph/hedera-local-node/blob/main/README.md) file.

---

This guide shows example steps for setting up Ubuntu and running Hedera Local Node on it. We are assuming clean install of Ubuntu 22.04. 

## Getting Started

### Requirements

* CPUs: 6
* Memory: 8GB
* Swap: 1 GB
* Disk space for docker: 64 GB


### Installing Docker Engine

The following steps are following the official guide. Please review it first for any updates or changes: [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)

1. Set up Docker's `apt` repository.

```
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```
2. Install the Docker packages
```
sudo apt-get -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
3. Add your user to the docker group
 ```
 sudo usermod -aG docker $USER
 sudo su - $USER
 ```
### Install Node.js
1. Installing the latest availble LTS version at the time of the writing. Please check [NodeSource Node.js Binary Distributions](https://github.com/nodesource/distributions) for specific or the current one:
```
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - &&\
sudo apt-get install -y nodejs
sudo chown -R $USER /usr/lib/node_modules
```

### Local Development Installation

1. Installing the `hedera-local` module. For more information or options check [main README](https://github.com/hashgraph/hedera-local-node#installation)

```
git clone https://github.com/hashgraph/hedera-local-node.git
cd hedera-local-node

npm install &&  npm run build && sudo npm install -g

hedera start -d
```



## Referenced Documents  

* [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
* [Linux post-installation steps for Docker Engine](https://docs.docker.com/engine/install/linux-postinstall/)
* [Installing Node.js via package manager](https://nodejs.org/en/download/package-manager)
* [NodeSource Node.js Binary Distributions](https://github.com/nodesource/distributions)
* [README file of hedera-local-node repo](https://github.com/hashgraph/hedera-local-node/blob/main/README.md)
