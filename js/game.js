// Spilldata
let coins = {};
let money = 0;
let lifetimeTotal = 0;
let soundEnabled = CONFIG.soundEnabledDefault;
let selectedBuyAmount = "1";

// Oppgraderingsdata
let purchasedUpgrades = []; // <--- NYTT: Husk alle kjøpte upgrades

// Autoflipper spesifikt
let autoFlipperLevel = 0;
let autoFlipperInterval = CONFIG.autoFlipper.baseInterval;
let autoFlipperTimer = null;
let autoflipProgress = 0;
let autoflipProgressTimer = null;

// Lyd
let flipSound = new Audio('assets/sounds/placeholder_flip.mp3');

// ============================
// INIT / LOAD
// ============================

document.getElementById('flip-button').addEventListener('click', manualFlipCoins);
document.getElementById('buy-coin-button').addEventListener('click', buyBestCoin);
document.getElementById('mute-button').addEventListener('click', toggleSound);
document.getElementById('reset-button').addEventListener('click', resetGame);

loadGame();

function loadGame() {
    const savedCoins = JSON.parse(localStorage.getItem('idleflip_coins'));
    const savedMoney = parseInt(localStorage.getItem('idleflip_money'));
    const savedLifetime = parseInt(localStorage.getItem('idleflip_lifetime'));
    const savedSound = localStorage.getItem('idleflip_sound');
    const savedUpgrades = JSON.parse(localStorage.getItem('idleflip_upgrades')) || [];
    const savedAutoLevel = parseInt(localStorage.getItem('idleflip_autoFlipperLevel')) || 0;

    if (savedCoins) {
        coins = savedCoins;
        if (!coins[CONFIG.coins[0].name] || coins[CONFIG.coins[0].name] < 1) {
            coins[CONFIG.coins[0].name] = 1;
        }
    } else {
        initializeCoins();
    }

    if (!isNaN(savedMoney)) money = savedMoney;
    if (!isNaN(savedLifetime)) lifetimeTotal = savedLifetime;
    if (savedSound !== null) soundEnabled = savedSound === 'true';
    purchasedUpgrades = savedUpgrades;
    autoFlipperLevel = savedAutoLevel;

    if (purchasedUpgrades.includes('autoflipper')) {
        setupAutoFlipper();
    }

    updateDisplay();
    setupAmountButtons();
}

function initializeCoins() {
    CONFIG.coins.forEach(coin => {
        coins[coin.name] = 0;
    });
    coins[CONFIG.coins[0].name] = 1;
}

function saveGame() {
    localStorage.setItem('idleflip_coins', JSON.stringify(coins));
    localStorage.setItem('idleflip_money', money.toString());
    localStorage.setItem('idleflip_lifetime', lifetimeTotal.toString());
    localStorage.setItem('idleflip_sound', soundEnabled.toString());
    localStorage.setItem('idleflip_upgrades', JSON.stringify(purchasedUpgrades));
    localStorage.setItem('idleflip_autoFlipperLevel', autoFlipperLevel.toString());
}

// ============================
// DISPLAY
// ============================

function updateDisplay() {
    const coinList = document.getElementById('coin-list');
    coinList.innerHTML = '';

    CONFIG.coins.forEach(coin => {
        const count = coins[coin.name] || 0;
        if (count > 0 || money >= coin.value) {
            const li = document.createElement('li');
            li.textContent = `${coin.name}: ${count}`;
            coinList.appendChild(li);
        }
    });

    document.getElementById('money').innerText = `${money} ${CONFIG.currencyName}`;
    document.getElementById('lifetime').innerText = `${lifetimeTotal} ${CONFIG.currencyName} collected`;
    document.getElementById('mute-button').innerText = `Mute: ${soundEnabled ? "Off" : "On"}`;

    updateBuyButtonText();
    updateAutoFlipperButton();
}

function updateBuyButtonText() {
    for (let i = CONFIG.coins.length - 1; i >= 0; i--) {
        const coin = CONFIG.coins[i];
        if (money >= coin.value) {
            let amount = 1;
            if (selectedBuyAmount === "5") {
                amount = Math.min(Math.floor(money / coin.value), 5);
            } else if (selectedBuyAmount === "10") {
                amount = Math.min(Math.floor(money / coin.value), 10);
            } else if (selectedBuyAmount === "max") {
                amount = Math.floor(money / coin.value);
            }
            document.getElementById('buy-coin-button').innerText = `Buy ${amount} ${coin.name}${amount > 1 ? 's' : ''} (${coin.value * amount}¢)`;
            return;
        }
    }
    document.getElementById('buy-coin-button').innerText = "Not enough money!";
}

// ============================
// FLIPPING
// ============================

function manualFlipCoins() {
    flipCoins(true);
}

function flipCoins(isManual = false) {
    if (isManual) {
        document.getElementById('flip-result').innerText = 'Flipping...';
    }

    if (soundEnabled) flipSound.play();

    setTimeout(() => {
        let heads = 0;
        let tails = 0;

        CONFIG.coins.forEach(coin => {
            const count = coins[coin.name] || 0;
            for (let i = 0; i < count; i++) {
                if (Math.random() < 0.5) {
                    tails++;
                } else {
                    heads++;
                    money += coin.value;
                    lifetimeTotal += coin.value;
                }
            }
        });

        ensureAtLeastOneCoin();
        autoUpgradeCoins();
        updateDisplay();
        saveGame();
        checkAutoFlipperUnlock();

        if (isManual) {
            document.getElementById('flip-result').innerText = `${heads} Heads, ${tails} Tails`;
        }
    }, CONFIG.flipDuration);
}

function ensureAtLeastOneCoin() {
    const totalCoins = Object.values(coins).reduce((a, b) => a + b, 0);
    if (totalCoins === 0) {
        coins[CONFIG.coins[0].name] = 1;
    }
}

// ============================
// KJØP
// ============================

function buyBestCoin() {
    for (let i = CONFIG.coins.length - 1; i >= 0; i--) {
        const coin = CONFIG.coins[i];
        if (money >= coin.value) {
            let amountToBuy = 1;
            if (selectedBuyAmount === "5") {
                amountToBuy = Math.min(Math.floor(money / coin.value), 5);
            } else if (selectedBuyAmount === "10") {
                amountToBuy = Math.min(Math.floor(money / coin.value), 10);
            } else if (selectedBuyAmount === "max") {
                amountToBuy = Math.floor(money / coin.value);
            }

            if (amountToBuy > 0) {
                money -= coin.value * amountToBuy;
                coins[coin.name] += amountToBuy;
                autoUpgradeCoins();
                updateDisplay();
                saveGame();
                return;
            }
        }
    }
}

function autoUpgradeCoins() {
    for (let i = 0; i < CONFIG.coins.length - 1; i++) {
        const current = CONFIG.coins[i];
        const next = CONFIG.coins[i + 1];

        while (coins[current.name] >= current.upgradeCost) {
            coins[current.name] -= current.upgradeCost;
            coins[next.name] += 1;
        }
    }
}

// ============================
// AUTOLFLIPPER
// ============================

function checkAutoFlipperUnlock() {
    if (!purchasedUpgrades.includes('autoflipper') && money >= CONFIG.autoFlipper.unlockAt) {
        showAutoFlipperBuyButton();
    }
}

function showAutoFlipperBuyButton() {
    if (!document.getElementById('upgrade-auto-button')) {
        const button = document.createElement('button');
        button.id = 'upgrade-auto-button';
        button.addEventListener('click', purchaseOrUpgradeAutoFlipper);
        document.getElementById('actions').appendChild(button);
    }
    updateAutoFlipperButton();
}

function updateAutoFlipperButton() {
    const button = document.getElementById('upgrade-auto-button');
    if (!button) return;

    const nextCost = CONFIG.autoFlipper.upgradeBaseCost * Math.pow(CONFIG.autoFlipper.upgradeCostMultiplier, autoFlipperLevel);

    button.innerText = purchasedUpgrades.includes('autoflipper')
        ? `Upgrade Autoflipper v${autoFlipperLevel + 1}: ${nextCost} ${CONFIG.currencyName}`
        : `Buy Autoflipper v1: ${CONFIG.autoFlipper.upgradeBaseCost} ${CONFIG.currencyName}`;

    button.style.color = (money >= nextCost) ? 'black' : 'red';
}

function purchaseOrUpgradeAutoFlipper() {
    const nextCost = CONFIG.autoFlipper.upgradeBaseCost * Math.pow(CONFIG.autoFlipper.upgradeCostMultiplier, autoFlipperLevel);

    if (money >= nextCost) {
        money -= nextCost;
        autoFlipperLevel += 1;

        if (!purchasedUpgrades.includes('autoflipper')) {
            purchasedUpgrades.push('autoflipper');
            setupAutoFlipper();
            showUpgradesSection();
        }

        updateUpgradeDisplay();
        updateDisplay();
        saveGame();
    }
}

function setupAutoFlipper() {
    restartAutoFlipperTimer();
}

function restartAutoFlipperTimer() {
    clearInterval(autoFlipperTimer);
    clearInterval(autoflipProgressTimer);
    autoflipProgress = 0;

    autoFlipperInterval = Math.max(
        CONFIG.autoFlipper.minInterval,
        CONFIG.autoFlipper.baseInterval - CONFIG.autoFlipper.intervalReduction * autoFlipperLevel
    );

    autoFlipperTimer = setInterval(() => {
        flipCoins(false);
    }, autoFlipperInterval);

    autoflipProgressTimer = setInterval(() => {
        autoflipProgress += 100;
        const percent = Math.min(100, (autoflipProgress / autoFlipperInterval) * 100);
        const button = document.getElementById('upgrade-auto-button');
        if (button) {
            button.style.background = `repeating-linear-gradient(45deg, #4CAF50 ${percent}%, #45a049 ${percent}%, #45a049 100%)`;
        }
        if (autoflipProgress >= autoFlipperInterval) {
            autoflipProgress = 0;
        }
    }, 100);
}

function showUpgradesSection() {
    const upgradesDiv = document.getElementById('upgrades');
    upgradesDiv.style.display = 'block';
    updateUpgradeDisplay();
}

function updateUpgradeDisplay() {
    const upgradesList = document.getElementById('upgrades-list');
    upgradesList.innerHTML = '';
    if (purchasedUpgrades.includes('autoflipper')) {
        const upgradeInfo = document.createElement('div');
        upgradeInfo.className = 'upgrade-item';
        upgradeInfo.innerText = `Autoflipper: v${autoFlipperLevel}`;
        upgradesList.appendChild(upgradeInfo);
    }
}

// ============================
// SETTINGS
// ============================

function toggleSound() {
    soundEnabled = !soundEnabled;
    updateDisplay();
    saveGame();
}

function setupAmountButtons() {
    const buttons = document.querySelectorAll('.amount-button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedBuyAmount = button.getAttribute('data-amount');
            updateBuyButtonText();
        });
    });

    document.querySelector('.amount-button[data-amount="1"]').classList.add('selected');
}

function resetGame() {
    if (confirm("Would you like to reset your progress?")) {
        if (confirm("ARE YOU SURE? THIS ACTION CANNOT BE UNDONE!")) {
            localStorage.clear();
            coins = {};
            money = 0;
            lifetimeTotal = 0;
            soundEnabled = CONFIG.soundEnabledDefault;
            purchasedUpgrades = [];
            autoFlipperLevel = 0;
            clearInterval(autoFlipperTimer);
            clearInterval(autoflipProgressTimer);
            autoflipProgress = 0;

            initializeCoins();
            saveGame();
            location.reload();
        }
    }
}
