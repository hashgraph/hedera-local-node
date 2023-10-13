module.exports = {
    CONTAINERS : [
        {
            name: "Consensus Node",
            label: "network-node",
            port: 50211,
        },
        {
            name: "Mirror Node",
            label: "mirror-node-grpc",
            port: 5600,
        },
        {
            name: "Relay",
            label: "json-rpc-relay",
            port: 7546,
        },
    ],
    CONSENSUS_NODE_LABEL: "network-node",
    MIRROR_NODE_LABEL: "mirror-node-rest",
    RELAY_LABEL: "json-rpc-relay",
    IS_WINDOWS: process.platform === "win32",
    UNKNOWN_VERSION: "Unknown"
}
