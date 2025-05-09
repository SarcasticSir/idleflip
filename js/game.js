// Spilldata
let coins = {};
let money = 0;
let lifetimeTotal = 0;
// lyd flagg initialiseres senere etter at CONFIG er lastet
let soundEnabled;
let selectedBuyAmount = "1";

function formatMoney(amount) {
    if (amount < 1e15) {
        return amount.toLocaleString('en-US');
    } else {
        return amount.toExponential(2).replace('+', '');
    }
}


// Oppgraderingsdata
let purchasedUpgrades = [];
let unlockedCoins = [];
let achievementsUnlocked = [];

// Autoflipper
let autoFlipperLevel = 0;
// autoFlipperInterval settes i loadGame()
let autoFlipperInterval = 0;
let autoFlipperTimer = null;

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
    const savedUnlocked = JSON.parse(localStorage.getItem('idleflip_unlockedCoins')) || [];
    const savedLastSave = parseInt(localStorage.getItem('idleflip_lastSave')) || Date.now();

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
    unlockedCoins = savedUnlocked;

    const now = Date.now();
    const timeAway = now - savedLastSave;

    // Gjenopprett kjøpte oppgraderinger
    purchasedUpgrades.forEach(upgrade => {
        restoreUpgrade(upgrade);
    });

    // Offline progress
    // Offline progress
if (purchasedUpgrades.includes('autoflipper')) {
    let autoflipInterval = CONFIG.autoFlipper.baseInterval;
    for (let i = 0; i < autoFlipperLevel; i++) {
        autoflipInterval *= CONFIG.autoFlipper.intervalReductionPercent;
    }
    autoflipInterval = Math.max(CONFIG.autoFlipper.minInterval, autoflipInterval);

    const flipsMissed = Math.floor(timeAway / autoflipInterval);

    if (flipsMissed > 0) {
        let earned = 0;
        CONFIG.coins.forEach(coin => {
            const count = coins[coin.name] || 0;
            earned += count * coin.value * flipsMissed * 0.5;
        });
        money += Math.floor(earned);
        lifetimeTotal += Math.floor(earned);

        alert(`Welcome back! You earned ${Math.floor(earned)} ${CONFIG.currencyName} while you were away!`);
    }
}

    soundEnabled = (savedSound !== null) ? savedSound === 'true' : CONFIG.soundEnabledDefault;

    autoFlipperInterval = CONFIG.autoFlipper.baseInterval;
    for (let i = 0; i < autoFlipperLevel; i++) {
        autoFlipperInterval *= CONFIG.autoFlipper.intervalReductionPercent;
    }
    autoFlipperInterval = Math.max(CONFIG.autoFlipper.minInterval, autoFlipperInterval);

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
    localStorage.setItem('idleflip_unlockedCoins', JSON.stringify(unlockedCoins));
    localStorage.setItem('idleflip_lastSave', Date.now().toString());
}

// ============================
// DISPLAY
// ============================

function updateDisplay() {
    const coinList = document.getElementById('coin-list');
    coinList.innerHTML = '';

    CONFIG.coins.forEach(coin => {
        const count = coins[coin.name] || 0;
        if (count > 0 || unlockedCoins.includes(coin.name)) {
            const li = document.createElement('li');
            li.textContent = `${coin.name}: ${count}`;
            coinList.appendChild(li);
        }
    });

    document.getElementById('money').innerText = `${formatMoney(money)} ${CONFIG.currencyName}`;
    document.getElementById('lifetime').innerText = `${formatMoney(lifetimeTotal)} ${CONFIG.currencyName} collected`;
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
            document.getElementById('buy-coin-button').innerText = `Buy ${amount} ${coin.name}${amount > 1 ? 's' : ''} (${formatMoney(coin.value * amount)} ChUn)`;
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
    if (!CONFIG.luckSettings) {
        console.warn("CONFIG.luckSettings mangler – setter fallback.");
        CONFIG.luckSettings = {
            variationPercent: 5,
            megaLuckChance: 0.01,
            megaUnluckChance: 0.01,
            megaLuckMessages: ["Mega lucky!"],
            megaUnluckMessages: ["Mega unlucky!"],
            luckyMessages: ["Lucky!"],
            unluckyMessages: ["Unlucky!"]
        };
    }

    if (isManual && soundEnabled && flipSound?.play) {
        try { flipSound.play(); } catch (e) {}
    }

    setTimeout(() => {
        let heads = 0;
        let tails = 0;
        let luckMessage = null;

        CONFIG.coins.forEach(coin => {
            const count = coins[coin.name] || 0;
            if (count > 0) {
                let chanceModifier = 0;

                const megaLuckRoll = Math.random();
                if (megaLuckRoll < CONFIG.luckSettings.megaLuckChance) {
                    chanceModifier = 0.2;
                    luckMessage = CONFIG.luckSettings.megaLuckMessages[Math.floor(Math.random() * CONFIG.luckSettings.megaLuckMessages.length)];
                }
                const megaUnluckRoll = Math.random();
                if (!luckMessage && megaUnluckRoll < CONFIG.luckSettings.megaUnluckChance) {
                    chanceModifier = -0.2;
                    luckMessage = CONFIG.luckSettings.megaUnluckMessages[Math.floor(Math.random() * CONFIG.luckSettings.megaUnluckMessages.length)];
                }
                if (!luckMessage) {
                    const variationRange = CONFIG.luckSettings.variationPercent / 100;
                    const variation = (Math.random() - 0.5) * variationRange * 2;
                    chanceModifier = variation;
                    if (variation > 0.03) {
                        luckMessage = CONFIG.luckSettings.luckyMessages[Math.floor(Math.random() * CONFIG.luckSettings.luckyMessages.length)];
                    } else if (variation < -0.03) {
                        luckMessage = CONFIG.luckSettings.unluckyMessages[Math.floor(Math.random() * CONFIG.luckSettings.unluckyMessages.length)];
                    }
                }

                let adjustedChance = Math.max(0, Math.min(1, 0.5 + chanceModifier));

                if (count <= 100) {
                    // 🎯 Få mynter: Flip individuelt
                    for (let i = 0; i < count; i++) {
                        if (Math.random() < adjustedChance) {
                            heads++;
                            money += coin.value;
                            lifetimeTotal += coin.value;
                        } else {
                            tails++;
                        }
                    }
                } else {
                    // 🎯 Mange mynter: Bruk statistikk
                    const calculatedHeads = Math.floor(count * adjustedChance);
                    const calculatedTails = count - calculatedHeads;

                    heads += calculatedHeads;
                    tails += calculatedTails;

                    money += calculatedHeads * coin.value;
                    lifetimeTotal += calculatedHeads * coin.value;
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
            if (luckMessage) {
                showLuckPopup(luckMessage);
            }
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

                if (!unlockedCoins.includes(coin.name)) {
                    unlockedCoins.push(coin.name);
                }

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

            if (!unlockedCoins.includes(next.name)) {
                unlockedCoins.push(next.name);
            }
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

    if (autoFlipperLevel >= CONFIG.autoFlipper.maxLevel) {
        button.innerText = "Autoflipper maxed!";
        button.style.color = 'black'; // 🔥 Vanlig farge, ikke disabled
        return;
    }

    const nextCost = CONFIG.autoFlipper.upgradeBaseCost * Math.pow(CONFIG.autoFlipper.upgradeCostMultiplier, autoFlipperLevel);

    button.innerText = purchasedUpgrades.includes('autoflipper')
        ? `Upgrade Autoflipper v${autoFlipperLevel + 1}: ${formatMoney(nextCost)} ${CONFIG.currencyName}`
        : `Buy Autoflipper v1: ${formatMoney(CONFIG.autoFlipper.upgradeBaseCost)} ${CONFIG.currencyName}`;

    button.style.color = (money >= nextCost) ? 'black' : 'red';
}


function purchaseOrUpgradeAutoFlipper() {
    if (autoFlipperLevel >= CONFIG.autoFlipper.maxLevel) {
        return; // 🛑 Spilleren kan ikke oppgradere over maks
    }

    const nextCost = CONFIG.autoFlipper.upgradeBaseCost * Math.pow(CONFIG.autoFlipper.upgradeCostMultiplier, autoFlipperLevel);

    if (money >= nextCost) {
        money -= nextCost;
        autoFlipperLevel += 1;

        if (!purchasedUpgrades.includes('autoflipper')) {
            purchasedUpgrades.push('autoflipper');
            setupAutoFlipper();
            showUpgradesSection();
        } else {
            setupAutoFlipper();
        }

        updateUpgradeDisplay();
        updateDisplay();
        saveGame();
    }
}


function setupAutoFlipper() {
    clearInterval(autoFlipperTimer);

    autoFlipperInterval = CONFIG.autoFlipper.baseInterval;

    for (let i = 0; i < autoFlipperLevel; i++) {
        autoFlipperInterval *= CONFIG.autoFlipper.intervalReductionPercent;
    }

    autoFlipperInterval = Math.max(CONFIG.autoFlipper.minInterval, autoFlipperInterval);

    startAutoFlipperTimer();
}


function startAutoFlipperTimer() {
    clearInterval(autoFlipperTimer);

    const button = document.getElementById('upgrade-auto-button');
    if (!button) return;

    let elapsed = 0;
    const stepSize = 5; // 5% per blokk
    const blockWidth = stepSize; // hver blokk dekker 5% av bredden

    autoFlipperTimer = setInterval(() => {
        elapsed += 100;
        const percent = Math.min(100, (elapsed / autoFlipperInterval) * 100);

        const filledBlocks = Math.floor(percent / stepSize);

        let backgroundParts = [];

        for (let i = 0; i < 20; i++) { // 20 blokker (100/5)
            if (i < filledBlocks) {
                // Alternere farge på hver fylt blokk
                const color = (i % 2 === 0) ? '#bbbbbb' : '#999999';
                backgroundParts.push(`${color} ${(i * blockWidth)}% ${(i + 1) * blockWidth}%`);
            } else {
                // Ikke fylt blokk = bakgrunnsgrå
                backgroundParts.push(`#dddddd ${(i * blockWidth)}% ${(i + 1) * blockWidth}%`);
            }
        }

        button.style.background = `linear-gradient(to right, ${backgroundParts.join(', ')})`;

        if (elapsed >= autoFlipperInterval) {
            flipCoins(false);
            elapsed = 0;
            button.style.background = `
                linear-gradient(to right, #dddddd 0%, #dddddd 100%)
            `;
        }
    }, 100);
}



function showLuckPopup(message) {
    const container = document.getElementById('luck-popup-container');
    const popup = document.createElement('div');
    popup.className = 'luck-popup';
    popup.innerText = message;
    container.appendChild(popup);

    // Fjern popup etter 2 sekunder
    setTimeout(() => {
        container.removeChild(popup);
    }, 2000);
}




// ============================
// UPGRADES SYSTEM
// ============================

function restoreUpgrade(upgradeName) {
    if (upgradeName === 'autoflipper') {
        showAutoFlipperBuyButton();
        setupAutoFlipper();
        showUpgradesSection();
    }
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
            unlockedCoins = [];
            autoFlipperLevel = 0;
            clearInterval(autoFlipperTimer);

            initializeCoins();
            saveGame();
            location.reload();
        }
    }
}
