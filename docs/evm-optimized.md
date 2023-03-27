# Summary

Currently Local Node supports optimized evm mode for better developer experience. Purpose of this is to allow for faster node startup, faster transactions, which allows for faster testing.
<br><br>

# Modes

## Full Mode

This mode support full local node experience. Same as mainnet, testnet and previewnet. This includes all the components of a production network - network node, mirror node, minio and uploaders.
<br>
Note: This is optional startup mode for local-node. Can be turned on by passing following options at startup `--full` or `--full=true`.
<br><br>

## Turbo Mode

This mode enables faster local node experience. It differs from other production environment by turning off and working around couple of components. We are using fewer docker containers responsible for handling export and import of record files, by bypassing them and saving the files directly to the disk. This saves time because we don't need to export the files to minio component and import them from there.
<br>
Note: This is the default startup mode for local-node. Can be turned off by passing following options at startup `--full` or `--full=true`.
<br><br>

# Diagrams

## Full mode diagram

```mermaid
        graph TD
        A["Network Node \n(hedera-services)"] --"record streams"----> B((("Local directory")))
        A--"account balances"----> B
        A --"sidecar records"---->B
        B --"inotify event"--> C["record-streams-uploader"]
        B --"inotify event"--> D["account-balances-uploader"]
        B --"inotify event"--> E["record-sidecar-uploader"]
        C --upload--> F["minio"]
        D --upload--> F
        E --uplaod--> F
        F--"pull"-->G1[["'downloader'\npart of importer\n Hedera-Mirror-Importer"]]
        G1---G["importer\nHedera-Mirror-Importer"]
        G-->H[(db\n postgres)]
        H---I["rest\nHedera-Mirror-Rest"]
        H---J["grpc\nHedera-Mirror-Grpc"]
        H---K["web3\nHedera-Mirror-Web3"]
        L["monitor\nHedera-Mirror-Monitor"]
        J<----L
        I<----L
        L--sends crypto transfers-->A
        R[relay\nHedera Json-Rpc Relay]--makes requests-->I
        R[relay\nHedera Json-Rpc Relay]--makes requests-->A
```

<br><br>

## Turbo mode diagram

```mermaid
        graph TD
        A["Network Node \n(hedera-services)"] --"record streams"----> B((("Local directory")))
        B--"pull"-->G1[["'downloader'\npart of importer\n Hedera-Mirror-Importer"]]
        G1---G["importer\nHedera-Mirror-Importer"]
        G-->H[(db\n postgres)]
        H---I["rest\nHedera-Mirror-Rest"]
        H---J["grpc\nHedera-Mirror-Grpc"]
        H---K["web3\nHedera-Mirror-Web3"]
        L["monitor\nHedera-Mirror-Monitor"]
        J<----L
        I<----L
        L--sends crypto transfers-->A
        R[relay\nHedera Json-Rpc Relay]--makes requests-->I
        R[relay\nHedera Json-Rpc Relay]--makes requests-->A
```
