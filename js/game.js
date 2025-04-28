// game.js

// Spilldata
let coins = {};
let money = 0;
let soundEnabled = CONFIG.soundEnabledDefault;
let selectedBuyAmount = "1"; // standard 1x

// Lyd
let flipSound = new Audio('assets/sounds/placeholder_flip.mp3');

document.getElementById('reset-button').addEventListener('click', resetGame);


// Last data fra localStorage
function loadGame() {
    const savedCoins = JSON.parse(localStorage.getItem('idleflip_coins'));
    const savedMoney = parseInt(localStorage.getItem('idleflip_money'));
    const savedSound = localStorage.getItem('idleflip_sound');

    if (savedCoins) {
        coins = savedCoins;
        if (!coins["Nano Tick"] || coins["Nano Tick"] < 1) {
            coins["Nano Tick"] = 1;
        }
    } else {
        initializeCoins();
    }

    if (!isNaN(savedMoney)) money = savedMoney;
    if (savedSound !== null) soundEnabled = savedSound === 'true';

    updateDisplay();
    setupAmountButtons();
}

// Start med 1 Nano Tick hvis ingen lagret
function initializeCoins() {
    CONFIG.coins.forEach(coin => {
        coins[coin.name] = 0;
    });
    coins["Nano Tick"] = 1;
}

// Lagre data
function saveGame() {
    localStorage.setItem('idleflip_coins', JSON.stringify(coins));
    localStorage.setItem('idleflip_money', money.toString());
    localStorage.setItem('idleflip_sound', soundEnabled.toString());
}

// Oppdater skjermen
function updateDisplay() {
    const coinList = document.getElementById('coin-list');
    coinList.innerHTML = '';

    CONFIG.coins.forEach(coin => {
        const count = coins[coin.name] || 0;
        const li = document.createElement('li');
        li.textContent = `${coin.name}: ${count}`;
        coinList.appendChild(li);
    });

    document.getElementById('money').innerText = `${money} ${CONFIG.currencyName}`;
    document.getElementById('mute-button').innerText = `Mute: ${soundEnabled ? "Off" : "On"}`;

    updateBuyButtonText();
}

// Oppdater "Buy best coin!" teksten
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

// Flip mynter
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
                }
            }
        });

        document.getElementById('flip-result').innerText = `${heads} Heads, ${tails} Tails`;
        autoUpgradeCoins();
        updateDisplay();
        saveGame();
    }, CONFIG.flipDuration);
}

// Kjøp beste mynt basert på valgt antall
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
    //alert("Not enough money!");
}

// Automatisk oppgradering av mynter
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

// Toggle lyd
function toggleSound() {
    soundEnabled = !soundEnabled;
    updateDisplay();
    saveGame();
}

// Sett opp antall-knapper
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

// Koble knapper
document.getElementById('flip-button').addEventListener('click', flipCoins);
document.getElementById('buy-coin-button').addEventListener('click', buyBestCoin);
document.getElementById('mute-button').addEventListener('click', toggleSound);

// Start spill
loadGame();

function resetGame() {
    if (confirm("Would you like to reset your progress?")) {
        if (confirm("ARE YOU SURE? THIS ACTION CANNOT BE UNDONE!")) {
            // Slett alt lagret
            localStorage.removeItem('idleflip_coins');
            localStorage.removeItem('idleflip_money');
            localStorage.removeItem('idleflip_sound');

            // Start spilldata på nytt
            initializeCoins(); // <-- denne setter 1 Nano Tick eller 1 første coin
            money = 0;
            saveGame(); // lagre slik at neste last er korrekt

            location.reload(); // Last inn på nytt
        }
    }
}
