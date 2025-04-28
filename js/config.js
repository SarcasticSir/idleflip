const CONFIG = {
    currencyName: "Chrono Units", // 🌟 Navn på valutaen
    flipDuration: 50,             // ⏳ Flip-animasjonens varighet i ms

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
        unlockAt: 1000,             // 🔓 Låses opp når du har 1000 Chrono Units
        baseInterval: 60000,         // 🕰️ Start: flip hvert 60 sekunder
        intervalReduction: 5000,     // 🔧 Hver oppgradering reduserer med 5 sek
        minInterval: 10000,          // ⏲️ Minimumsintervall: 10 sekunder
        upgradeBaseCost: 500,        // 💵 Første autoflipper-kjøp koster 500 units
        upgradeCostMultiplier: 2     // 💥 Hver oppgradering dobler prisen
    },

    soundEnabledDefault: true       // 🔊 Start med lyd på
};
