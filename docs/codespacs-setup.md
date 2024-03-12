
# Codespaces setup instructions 

---
**NOTE**

Please review first the [Quickstart for GitHub Codespaces](https://docs.github.com/en/codespaces/getting-started/quickstart) guide.

In order Mirror Node Web Explorer to work, please use [Visual Studio Code application](https://docs.github.com/en/codespaces/setting-your-user-preferences/setting-your-default-editor-for-github-codespaces#setting-your-default-editor)

---

A codespaces is a development environment that's hosted in the cloud. You can customize your project for GitHub Codespaces by committing configuration files to your repository (often known as Configuration-as-Code), which creates a repeatable codespaces configuration for all users of your project. [GitHub Codespaces overview](https://docs.github.com/en/codespaces/overview)

## Getting Started

### Change Editor preference

In [Editor preference](https://github.com/settings/codespaces) change your client to `Visual Studio Code` (Should not be `Visual Studio Code for the Web`)

### Check the billing information

Get to know what are the free and paid plans includes: [About billing for GitHub Codespaces](https://docs.github.com/en/billing/managing-billing-for-github-codespaces/about-billing-for-github-codespaces)

### Run codespaces against the hedera local node
Open the [Hedela Local Node repo](https://github.com/hashgraph/hedera-local-node) and click on the `Code`->`Codespaces`->`...`-> `New with options...` button and choose the appropriate settings:
![Gitpod Open button](https://docs.github.com/assets/cb-69605/mw-1440/images/help/codespaces/default-machine-type.webp)

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
`.devcontainer/devcontainer.json` is the configuration file for Codespaces: [devcontainer.json](https://containers.dev/implementors/json_reference/)

## Referenced Documents  

* [Quickstart for GitHub Codespaces](https://docs.github.com/en/codespaces/getting-started/quickstart)
* [GitHub Codespaces overview](https://docs.github.com/en/codespaces/overview)
* [About billing for GitHub Codespaces](https://docs.github.com/en/billing/managing-billing-for-github-codespaces/about-billing-for-github-codespaces)
* [devcontainer.json](https://containers.dev/implementors/json_reference/)