// game.js

// Spilldata
let coins = {};
let money = 0;
let lifetimeTotal = 0;
let soundEnabled = CONFIG.soundEnabledDefault;
let selectedBuyAmount = "1";

// Autoflipper data
let autoFlipperUnlocked = false;
let autoFlipperActive = false;
let autoFlipperInterval = CONFIG.autoFlipper.baseInterval;
let autoFlipperTimer = null;
let autoFlipperLevel = 0;

// Lyd
let flipSound = new Audio('assets/sounds/placeholder_flip.mp3');

// Koble knapper
document.getElementById('flip-button').addEventListener('click', flipCoins);
document.getElementById('buy-coin-button').addEventListener('click', buyBestCoin);
document.getElementById('mute-button').addEventListener('click', toggleSound);
document.getElementById('reset-button').addEventListener('click', resetGame);

// Start spill
loadGame();

function loadGame() {
    const savedCoins = JSON.parse(localStorage.getItem('idleflip_coins'));
    const savedMoney = parseInt(localStorage.getItem('idleflip_money'));
    const savedLifetime = parseInt(localStorage.getItem('idleflip_lifetime'));
    const savedSound = localStorage.getItem('idleflip_sound');

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
}

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
    updateAutoflipperStatus();
    updateAutoFlipperButton();
    checkAutoFlipperUnlock();
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

function flipCoins() {
    document.getElementById('flip-result').innerText = 'Flipping...';

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

        document.getElementById('flip-result').innerText = `${heads} Heads, ${tails} Tails`;
        autoUpgradeCoins();
        updateDisplay();
        saveGame();
    }, CONFIG.flipDuration);
}

function ensureAtLeastOneCoin() {
    const totalCoins = Object.values(coins).reduce((a, b) => a + b, 0);
    if (totalCoins === 0) {
        coins[CONFIG.coins[0].name] = 1;
    }
}

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
            autoFlipperUnlocked = false;
            autoFlipperActive = false;
            autoFlipperInterval = CONFIG.autoFlipper.baseInterval;
            autoFlipperTimer = null;
            autoFlipperLevel = 0;

            initializeCoins();
            saveGame();
            location.reload();
        }
    }
}

// Autoflipper-delen
function checkAutoFlipperUnlock() {
    if (!autoFlipperUnlocked && money >= CONFIG.autoFlipper.unlockAt) {
        autoFlipperUnlocked = true;
        startAutoFlipper();
        showAutoFlipperUpgradeButton();
    }
}

function startAutoFlipper() {
    if (autoFlipperActive) return;
    autoFlipperActive = true;
    startAutoFlipperTimer();
}

function startAutoFlipperTimer() {
    if (!autoFlipperActive) return;

    let elapsed = 0;
    const button = document.getElementById('upgrade-auto-button');
    if (!button) return;

    clearInterval(autoFlipperTimer);
    autoFlipperTimer = setInterval(() => {
        elapsed += 100;
        const percent = Math.min(100, (elapsed / autoFlipperInterval) * 100);

        button.style.background = `linear-gradient(to right, green ${percent}%, white ${percent}%)`;

        if (elapsed >= autoFlipperInterval) {
            flipCoins();
            elapsed = 0;
            button.style.background = `linear-gradient(to right, green 0%, white 0%)`;
        }
    }, 100);
}

function upgradeAutoFlipper() {
    const upgradeCost = CONFIG.autoFlipper.upgradeBaseCost * Math.pow(CONFIG.autoFlipper.upgradeCostMultiplier, autoFlipperLevel);

    if (money >= upgradeCost) {
        money -= upgradeCost;
        autoFlipperLevel += 1;

        autoFlipperInterval = Math.max(
            CONFIG.autoFlipper.minInterval,
            CONFIG.autoFlipper.baseInterval - CONFIG.autoFlipper.intervalReduction * autoFlipperLevel
        );

        clearInterval(autoFlipperTimer);
        startAutoFlipperTimer();

        updateAutoFlipperButton();
        updateDisplay();
        saveGame();
    }
}

function showAutoFlipperUpgradeButton() {
    const actionsDiv = document.getElementById('actions');
    const button = document.createElement('button');
    button.id = 'upgrade-auto-button';
    button.style.color = 'black';
    button.textContent = `Buy Autoflipper: ${CONFIG.autoFlipper.upgradeBaseCost} ${CONFIG.currencyName}`;
    button.addEventListener('click', upgradeAutoFlipper);
    actionsDiv.appendChild(button);

    updateAutoFlipperButton();
}

function updateAutoFlipperButton() {
    const button = document.getElementById('upgrade-auto-button');
    if (!button) return;

    const nextCost = CONFIG.autoFlipper.upgradeBaseCost * Math.pow(CONFIG.autoFlipper.upgradeCostMultiplier, autoFlipperLevel);

    if (money >= nextCost) {
        button.style.color = 'black';
        button.style.fontWeight = 'bold';
    } else {
        button.style.color = 'red';
        button.style.fontWeight = 'bold';
    }

    button.textContent = `Buy Autoflipper v${autoFlipperLevel + 1}: ${nextCost} ${CONFIG.currencyName}`;
}

function updateAutoflipperStatus() {
    const status = document.getElementById('autoflipper-status');
    if (!status) return;

    if (!autoFlipperUnlocked) {
        status.textContent = "Autoflipper: Locked";
    } else {
        status.textContent = `Autoflipper Level: ${autoFlipperLevel}`;
    }
}
