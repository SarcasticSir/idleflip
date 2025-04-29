const CONFIG = {
    currencyName: "Chrono Units", // 🌟 Navn på valutaen
    flipDuration: 50,             // ⏳ Flip-animasjonens varighet i ms

    luckSettings: {
        variationPercent: 5, // Standard variasjon: ±5%
        megaLuckChance: 0.01, // 1% sjanse for super lucky
        megaUnluckChance: 0.01, // 1% sjanse for super unlucky
        megaLuckMessages: [
            "Incredible! The time gods smile upon you!",
            "Ultimate flip power activated!",
            "Legendary luck! The universe bends to your will!",
            "Mega lucky! You bent space-time itself!"
        ],
        megaUnluckMessages: [
            "Oh no! The void consumes your flips...",
            "Disastrous flip! Better luck next time.",
            "Terrible luck! The Chrono Units slipped away...",
            "Mega unlucky! The quantum fields betrayed you!"
        ],
        luckyMessages: [
            "Nice! The winds of fate favor you.",
            "Good flip! Luck is on your side!",
            "You caught a glimpse of fortune!",
            "Luck whispers your name!"
        ],
        unluckyMessages: [
            "Bad luck! The flip was harsh.",
            "Unfortunate... the coins weren't kind.",
            "You fought fate and lost!",
            "Not your lucky flip!"
        ]
    }
,    

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
        baseInterval: 600000,         // 🕰️ Start: flip hvert 10 minutt
        intervalReductionPercent: 0.8607,     // 🔧 Hver oppgradering reduserer med 13.93%
        minInterval: 100,          // ⏲️ Minimumsintervall: 0.1 sekunder
        upgradeBaseCost: 500,        // 💵 Første autoflipper-kjøp koster 500 units
        upgradeCostMultiplier: 2,     // 💥 Hver oppgradering dobler prisen
        maxLevel: 50 // 🔥 NYTT: Maks nivå for autoflipper

    },

    soundEnabledDefault: true       // 🔊 Start med lyd på

    
};

