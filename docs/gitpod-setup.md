
# Gitpod setup instructions 

---
**NOTE**

Please review first the [Getting started](https://www.gitpod.io/docs/introduction/getting-started) guide.

In order Mirror Node Web Explorer to work, please use [Desktop Editor](https://www.gitpod.io/docs/references/ides-and-editors/vscode)

---

Gitpod is an open source development platform for teams to efficiently and securely develop software together. Born in the cloud, Gitpod’s Cloud Development Environments (CDEs) help developers to be always ready-to-code from any device, from anywhere. It brings developers back to flow and removes the manual setup and maintenance of static and brittle local development environments.

## Getting Started

### Register in Gitpod
Register in Gitpod by logging with your GitLab/GitHub/Bitbucket account: [LogIn page](https://gitpod.io/login/)

### Check the billing information
Get to know what are the free and paid plans includes: [Plans and pricing](https://www.gitpod.io/pricing)

### Set proper permissions
Add enable `public_repo` permission for Github provider on [Git Providers](https://gitpod.io/user/integrations) page on Gitpod

### Install Browser extension
Install browser extension using the following [guide](https://www.gitpod.io/docs/configure/user-settings/browser-extension)

### IDEs & Editors
You can review the support for the popular IDE/editors e.g. JetBrains and VS Code desktop at [IDEs & Editors](https://www.gitpod.io/docs/references/ides-and-editors)


### Run Gitpod against the hedera local node
Open the [Hedela Local Node repo](https://github.com/hashgraph/hedera-local-node) and click on the Gitpod `Open` button (it will be present if you have already install the browser extension) as per the example image below:
![Gitpod Open button](https://www.gitpod.io/images/docs/browser-extension-repo.png)

This will run Gitpod workspace with CDE of your choice and will deploy local node.

### Accessing ports

The following ports are setup to be accessed:
| Type                              | Endpoint                                         |
| --------------------------------- | ------------------------------------------------ |
| Consensus Node Endpoint           | [http://localhost:50211](http://localhost:50211) |
| Mirror Node GRPC Endpoint         | [http://localhost:5600](http://localhost:5600)   |
| Mirror Node REST API Endpoint     | [http://localhost:5551](http://localhost:5551)   |
| JSON RPC Relay Endpoint           | [http://localhost:7546](http://localhost:7546)   |
| JSON RPC Relay Websocket Endpoint | [http://localhost:8546](http://localhost:8546)   |
| Mirror Node Explorer              | [http://localhost:8080](http://localhost:8080)   |
| Grafana UI                        | [http://localhost:3000](http://localhost:3000)   |
| Prometheus UI                     | [http://localhost:9090](http://localhost:9090)   |

They will be redirect automatically on the localhost of your computer if you are using desktop VS Code.

### Config file
`.gitpod.yml` is the configuration file for Gitpod [.gitpod.yml](https://www.gitpod.io/docs/references/gitpod-yml)

## Referenced Documents  

* [Getting started](https://www.gitpod.io/docs/introduction/getting-started)
* [Learn Gitpod](https://www.gitpod.io/docs/introduction/learn-gitpod)
* [Browser & Desktop](https://www.gitpod.io/docs/introduction/learn-gitpod/browser-desktop)
* [Tasks](https://www.gitpod.io/docs/configure/workspaces/tasks)
* [Ports](https://www.gitpod.io/docs/configure/workspaces/ports)
* [Browser Extension](https://www.gitpod.io/docs/configure/user-settings/browser-extension)
* [.gitpod.yml](https://www.gitpod.io/docs/references/gitpod-yml)
* [IDEs & Editors](https://www.gitpod.io/docs/references/ides-and-editors)
* [Github Integration](https://www.gitpod.io/docs/integrations/github)
* [Plans and pricing](https://www.gitpod.io/pricing)