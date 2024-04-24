
# Codespaces setup instructions 

---
**NOTE**

Please review first the [Quickstart for GitHub Codespaces](https://docs.github.com/en/codespaces/getting-started/quickstart) guide.

In order Mirror Node Web Explorer to work, please use [Visual Studio Code application](https://docs.github.com/en/codespaces/setting-your-user-preferences/setting-your-default-editor-for-github-codespaces#setting-your-default-editor)

---

Codespaces is a development environment that's hosted in the cloud. You can customize your project for GitHub Codespaces by committing configuration files to your repository (often known as Configuration-as-Code), which creates a repeatable codespaces configuration for all users of your project. [GitHub Codespaces overview](https://docs.github.com/en/codespaces/overview)

## Getting Started

### Change Editor preference

In [Editor preference](https://github.com/settings/codespaces) change your client to `Visual Studio Code` (Should not be `Visual Studio Code for the Web`)

### Check the billing information

Get to know what are the free and paid plans includes: [About billing for GitHub Codespaces](https://docs.github.com/en/billing/managing-billing-for-github-codespaces/about-billing-for-github-codespaces)

### Run codespaces against the hedera local node
Open the [Hedela Local Node repo](https://github.com/hashgraph/hedera-local-node) and click on the `Code`->`Codespaces`->`...`-> `New with options...` button and choose the appropriate settings:
![Codespaces new button](https://docs.github.com/assets/cb-69605/mw-1440/images/help/codespaces/default-machine-type.webp)

### Services

The following ports are setup to be accessed:
| Type                              | Endpoint                                         |
| --------------------------------- | ------------------------------------------------ |
| Consensus Node Endpoint           | [http://localhost:50211](http://localhost:50211) |
| Mirror Node GRPC Endpoint         | [http://localhost:5600](http://localhost:5600)   |
| Mirror Node REST API Endpoint     | [http://localhost:5551](http://localhost:5551)   |
| JSON RPC Relay Endpoint           | [http://localhost:7546](http://localhost:7546)   |
| JSON RPC Relay Websocket Endpoint | [http://localhost:8546](http://localhost:8546)   |
| Mirror Node Explorer (Hashscan)              | [http://localhost:8080/devnet/dashboard](http://localhost:8080/devnet/dashboard)|
| Grafana UI                        | [http://localhost:3000](http://localhost:3000)   |
| Prometheus UI                     | [http://localhost:9090](http://localhost:9090)   |

They will be redirected automatically to the localhost of your computer if you are using desktop VS Code.

### Config file
`.devcontainer/devcontainer.json` is the configuration file for Codespaces: [`devcontainer.json`](https://containers.dev/implementors/json_reference/)

### Testing

#### Mirror Node REST API

The following command queries the Mirror Node for a list of accounts on your Hedera network.

```shell
curl "http://localhost:5551/api/v1/accounts" \
  -X GET
```

See the [Mirror Node interact API docs](https://testnet.mirrornode.hedera.com/api/v1/docs/)
for a full list of available APIs.

#### JSON RPC Relay

The following command queries the RPC Relay for the latest block on your Hedera network.

```shell
curl "http://localhost:7546" \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"eth_getBlockByNumber","params":["latest",false],"id":1,"jsonrpc":"2.0"}'
```

See the [endpoint table](https://github.com/hashgraph/hedera-json-rpc-relay/blob/main/docs/rpc-api.md#endpoint-table)
in `hedera-json-rpc-relay` for a full list of available RPCs.

#### Mirror Node Explorer (Hashscan)

Simply visit the URL in your browser.

Ensure that `LOCALNET` is selected, as this will show you
the Hedera network running within your Codespaces environment,
and not one of the public nodes.

## Referenced Documents  

* [Quickstart for GitHub Codespaces](https://docs.github.com/en/codespaces/getting-started/quickstart)
* [GitHub Codespaces overview](https://docs.github.com/en/codespaces/overview)
* [About billing for GitHub Codespaces](https://docs.github.com/en/billing/managing-billing-for-github-codespaces/about-billing-for-github-codespaces)
* [devcontainer.json](https://containers.dev/implementors/json_reference/)

