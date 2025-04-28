const CONFIG = {
    currencyName: "Chrono Units",
    flipDuration: 50, // For rask testing

    coins: [
        { name: "Nano Tick", value: 1, upgradeCost: 10 },
        { name: "Micro Second", value: 10, upgradeCost: 10 },
        { name: "Milli Minute", value: 100, upgradeCost: 10 },
        { name: "Chrono Chip", value: 1000, upgradeCost: 10 },
        { name: "Stellar Cycle", value: 10000, upgradeCost: 10 },
        { name: "Temporal Shard", value: 100000, upgradeCost: 10 },
        { name: "Quantum Phase", value: 1000000, upgradeCost: 10 },
        { name: "Nebula Pulse", value: 10000000, upgradeCost: 10 },
        { name: "Void Hour", value: 100000000, upgradeCost: 10 },
        { name: "Singularity Epoch", value: 1000000000, upgradeCost: null }
    ],

    autoFlipper: {
        unlockAt: 1000,
        baseInterval: 60000,
        intervalReduction: 5000,
        minInterval: 10000,
        upgradeBaseCost: 500,
        upgradeCostMultiplier: 2
    },

    soundEnabledDefault: true
};
