document.addEventListener("DOMContentLoaded", startGame);

function startGame() {
    // --- Configuration Constants ---
    const GAME_SETTINGS = {
        BASE_SPEED: 4,
        COIN_SPAWN_INITIAL_RATE: 1200,
        POWER_UP_DURATION_MS: 7000,
        POWER_UP_SPAWN_INTERVAL_MS: 15000,
        COIN_BOOST_PRICE: 100,
        COIN_BOOST_SPAWN_RATE: 500,
        PLAYER_EXPANDED_COLLISION_BUFFER: 10,
        COIN_MAGNET_RADIUS: 200,
        COIN_ANIMATION_DURATION: 150,
        TRAIL_PIECE_FADE_OUT_DELAY: 200,
        TRAIL_PIECE_REMOVE_DELAY: 400,
        MESSAGE_DISPLAY_DURATION: 2000,
        MESSAGE_FADE_OUT_DURATION: 1000,
        SPAWN_EXCLUSION_BUFFER_COIN: 40,
        SPAWN_EXCLUSION_BUFFER_POWERUP: 60,
        SAVE_SLOTS: 3, // Number of save slots
        LOCAL_STORAGE_KEY_PREFIX: 'trailTrotSave_', // Prefix for save keys
    };

    // Consolidated shop upgrade data
    const UPGRADES = {
        SPAWN_RATE: {
            costs: [50, 150, 300, 600, 1000],
            values: [1000, 800, 600, 400, 200],
        }
    };

    // ACHIEVEMENTS constant removed entirely

    // Centralized coin multipliers and trail tiers
    const GAME_DATA = {
        COIN_MULTIPLIERS_BY_TIER: {
            10: 2, 25: 4, 75: 6, 100: 8,
            175: 8, 200: 8, 250: 8, 300: 8,
        },
        TRAIL_TIERS: {
            red: 10, blue: 10, green: 10, yellow: 10,
            cyan: 25, magenta: 25, lime: 25, lavender: 25,
            darkviolet: 75, darkgreen: 75, darkblue: 75, darkorange: 75, white: 100,
            gold: 250, silver: 200, rebeccapurple: 175, lightblue: 300,
            rainbow: 500 // Price for consistency, actual multiplier handled separately
        },
        // TIER1_TRAIL_COLORS removed as it was only for achievement
    };

    // Image paths for power-ups
    const POWER_UP_ICONS = {
        speed: "speed_boost_icon.png",
        magnet: "magnet_icon.png",
        double_coin: "double_coin_icon.png",
    };

    // --- DOM Elements ---
    const horseRider = document.getElementById("horseRider");
    const horseImg = document.querySelector(".horse"); // Correctly get the horse image for collision
    const shopZone = document.getElementById("shopZone");
    const shopUI = document.getElementById("shopUI");
    const coinCounter = document.getElementById("coinCounter");
    const spawnBoostBtn = document.getElementById("spawnBoostBtn");
    const spawnRateUpgradeBtn = document.getElementById("spawnRateUpgradeBtn");
    const trailOptionsContainer = document.querySelector("#shopUI"); // #shopUI as general container for delegation

    // Save/Load Screen DOM elements
    const saveLoadScreen = document.getElementById("saveLoadScreen");
    const saveSlotsContainer = document.querySelector(".save-slots-container");
    const closeSaveLoadScreenBtn = document.getElementById("closeSaveLoadScreenBtn");

    const secretTrailElement = document.querySelector(".secret-trail");
    const secretHeadingElement = document.querySelector(".secret-heading");

    // Create message container once
    const messageContainer = document.createElement('div');
    messageContainer.id = 'messageContainer';
    document.body.appendChild(messageContainer);

    // --- Game State Variables ---
    let x = 600, y = 400; // These represent the top-left of horseRider
    let speed = GAME_SETTINGS.BASE_SPEED;
    let keysHeld = {};
    let inShopLastFrame = false;
    let spawnBoostPurchased = false;
    const purchasedTrails = new Set();
    let equippedTrail = null;
    let coins = 0;
    let currentTrailColor = null; // Storing the actual color for trail rendering
    let currentTrailColorTier = 0; // Storing the tier for speed calculation

    // Power-up state variables (timers are now managed within the activatePowerUp function more explicitly)
    let isSpeedBoostActive = false;
    let isCoinMagnetActive = false;
    let isDoubleCoinActive = false;

    // Quest/Achievement state variables removed
    // let totalCoinsCollected = 0;
    // let tier1TrailsPurchasedCount = 0;
    // let distanceTraveled = 0;

    // Coin spawn system
    let coinSpawnRate = GAME_SETTINGS.COIN_SPAWN_INITIAL_RATE;
    let spawnInterval; // Will be set after load

    // interval for power-ups
    let powerUpSpawnInterval;

    // Spawn Rate Upgrade System
    let spawnRateUpgradeLevel = 0;

    // Game pause state
    let isGamePaused = false;

    // Audio elements - preloaded and managed centrally
    const audio = {
        bgMusic: new Audio('background_music.mp3'),
        coinSound: new Audio('coin_pickup.mp3'),
        shopOpenSound: new Audio('shop_open.mp3'),
        shopCloseSound: new Audio('shop_close.mp3'),
        buttonClickSound: new Audio('button_click.mp3')
    };

    // Configure audio properties
    audio.bgMusic.loop = true;
    audio.bgMusic.volume = 0.3;
    audio.coinSound.volume = 0.5;
    audio.shopOpenSound.volume = 0.6;
    audio.shopCloseSound.volume = 0.6;
    audio.buttonClickSound.volume = 0.7;

    // --- SAVE/LOAD SYSTEM ---

    // Generic function to get save slot data
    function getSaveSlotData(slotId) {
        const key = GAME_SETTINGS.LOCAL_STORAGE_KEY_PREFIX + slotId;
        const savedState = localStorage.getItem(key);
        if (savedState) {
            try {
                const data = JSON.parse(savedState);
                return {
                    coins: data.coins,
                    equippedTrail: data.equippedTrail || "None",
                    lastSaved: new Date(data.lastSaved).toLocaleString(),
                    // achievement data removed from save slot summary
                };
            } catch (e) {
                console.error("Error parsing save data for slot", slotId, e);
                return null;
            }
        }
        return null;
    }

    function saveGameToSlot(slotId) {
        const gameState = {
            coins,
            x, // Player position
            y,
            purchasedTrails: Array.from(purchasedTrails),
            equippedTrail,
            currentTrailColor,
            currentTrailColorTier,
            spawnBoostPurchased,
            spawnRateUpgradeLevel,
            // totalCoinsCollected, tier1TrailsPurchasedCount, distanceTraveled removed from save
            // achievements removed from save
            lastSaved: new Date().toISOString(), // Timestamp
        };
        const key = GAME_SETTINGS.LOCAL_STORAGE_KEY_PREFIX + slotId;
        localStorage.setItem(key, JSON.stringify(gameState));
        showMessage(`Game saved to Slot ${slotId + 1}!`, "save");
        updateSaveLoadScreen(); // Refresh screen
    }

    function loadGameFromSlot(slotId) {
        const key = GAME_SETTINGS.LOCAL_STORAGE_KEY_PREFIX + slotId;
        const savedState = localStorage.getItem(key);
        if (savedState) {
            const gameState = JSON.parse(savedState);
            coins = gameState.coins;
            x = gameState.x || 600; // Load position, default if not found
            y = gameState.y || 400;
            purchasedTrails.clear();
            (gameState.purchasedTrails || []).forEach(trail => purchasedTrails.add(trail)); // Ensure array for iteration
            equippedTrail = gameState.equippedTrail;
            currentTrailColor = gameState.currentTrailColor;
            currentTrailColorTier = gameState.currentTrailColorTier;
            spawnBoostPurchased = gameState.spawnBoostPurchased;
            spawnRateUpgradeLevel = gameState.spawnRateUpgradeLevel || 0;
            // totalCoinsCollected, tier1TrailsPurchasedCount, distanceTraveled removed from load
            // achievements removed from load logic (no need to restore a non-existent system)

            // Re-apply game state based on loaded data
            updateCoinDisplay();
            if (equippedTrail) {
                applyTrailColor(equippedTrail);
            } else {
                speed = GAME_SETTINGS.BASE_SPEED;
            }
            applySpawnRateUpgrade(); // Recalculate and set spawn rate
            updatePosition(); // Immediately update player position

            showMessage(`Game loaded from Slot ${slotId + 1}!`, "load");
            updateShopButtons();
            checkForSecretTrail(); // Still needed to show secret trail if criteria met
            hideSaveLoadScreen(); // Close screen after loading
        } else {
            showMessage(`No saved game found in Slot ${slotId + 1}.`, "info");
        }
    }

    // --- Save/Load Screen UI Management ---
    function showSaveLoadScreen() {
        isGamePaused = true; // Pause the game loop
        saveLoadScreen.style.display = "flex";
        shopUI.style.display = "none"; // Hide shop if open
        audio.bgMusic.pause(); // Pause music
        audio.shopCloseSound.play(); // Play a sound indicating transition
        updateSaveLoadScreen();
    }

    function hideSaveLoadScreen() {
        isGamePaused = false; // Resume the game loop
        saveLoadScreen.style.display = "none";
        audio.bgMusic.play().catch(e => console.error("Failed to resume music:", e)); // Resume music
    }

    function updateSaveLoadScreen() {
        saveSlotsContainer.innerHTML = ''; // Clear existing slots

        for (let i = 0; i < GAME_SETTINGS.SAVE_SLOTS; i++) {
            const slotData = getSaveSlotData(i);
            const slotElement = document.createElement('div');
            slotElement.className = 'save-slot';
            slotElement.dataset.slotId = i;

            let infoText = 'Empty';
            let loadDisabled = true;

            if (slotData) {
                infoText = `Coins: ${slotData.coins}\nTrail: ${slotData.equippedTrail}\nSaved: ${slotData.lastSaved}`;
                loadDisabled = false;
            }

            slotElement.innerHTML = `
                <h3>Slot ${i + 1}</h3>
                <p class="slot-info">${infoText}</p>
                <div class="slot-buttons">
                    <button class="save-btn">Save</button>
                    <button class="load-btn" ${loadDisabled ? 'disabled' : ''}>Load</button>
                </div>
            `;
            saveSlotsContainer.appendChild(slotElement);
        }

        // Add event listeners for new buttons
        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                audio.buttonClickSound.play();
                const slotId = parseInt(e.target.closest('.save-slot').dataset.slotId);
                saveGameToSlot(slotId);
            });
        });

        document.querySelectorAll('.load-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                audio.buttonClickSound.play();
                const slotId = parseInt(e.target.closest('.save-slot').dataset.slotId);
                loadGameFromSlot(slotId);
            });
        });
    }

    // --- UI & Shop Functions ---

    // Fading message display
    function showMessage(message, type = 'info') {
        const msgElement = document.createElement('div');
        msgElement.textContent = message;
        msgElement.className = `message ${type}`;
        messageContainer.appendChild(msgElement);

        setTimeout(() => {
            msgElement.style.opacity = '0';
            setTimeout(() => msgElement.remove(), GAME_SETTINGS.MESSAGE_FADE_OUT_DURATION);
        }, GAME_SETTINGS.MESSAGE_DISPLAY_DURATION);
    }

    // Handles logic for initial coin boost
    function handleSpawnBoostClick() {
        audio.buttonClickSound.play();
        if (coins >= GAME_SETTINGS.COIN_BOOST_PRICE && !spawnBoostPurchased) {
            coins -= GAME_SETTINGS.COIN_BOOST_PRICE;
            updateCoinDisplay();
            spawnBoostPurchased = true;
            applySpawnRateUpgrade(); // Apply new rate (which now considers the boost)
            updateShopButtons(); // Update button state
            showMessage("Coin Boost Purchased!", "success");
        } else if (spawnBoostPurchased) {
            showMessage("Already boosted!", "info");
        } else {
            showMessage("Not enough coins!", "error");
        }
    }

    // Handles logic for spawn rate upgrade
    function handleSpawnRateUpgradeClick() {
        audio.buttonClickSound.play();
        if (spawnRateUpgradeLevel < UPGRADES.SPAWN_RATE.costs.length) {
            const cost = UPGRADES.SPAWN_RATE.costs[spawnRateUpgradeLevel];
            if (coins >= cost) {
                coins -= cost;
                spawnRateUpgradeLevel++;
                updateCoinDisplay();
                applySpawnRateUpgrade();
                updateShopButtons();
                showMessage("Spawn Rate Upgraded!", "success");
            } else {
                showMessage("Not enough coins for upgrade!", "error");
            }
        } else {
            showMessage("Spawn Rate is Max Level!", "info");
        }
    }

    // Applies the current spawn rate upgrade level
    function applySpawnRateUpgrade() {
        clearInterval(spawnInterval); // Clear current interval

        // Determine the effective coin spawn rate based on upgrades
        if (spawnRateUpgradeLevel > 0) {
            coinSpawnRate = UPGRADES.SPAWN_RATE.values[spawnRateUpgradeLevel - 1];
        } else if (spawnBoostPurchased) { // If original boost was purchased and no tier upgrades
            coinSpawnRate = GAME_SETTINGS.COIN_BOOST_SPAWN_RATE;
        } else { // No boosts or upgrades
            coinSpawnRate = GAME_SETTINGS.COIN_SPAWN_INITIAL_RATE;
        }
        spawnInterval = setInterval(spawnReward, coinSpawnRate); // Start new interval
    }

    function updateCoinDisplay() {
        coinCounter.textContent = `Coins: ${coins}`;
    }

    // Labels trail prices if not already labelled
    function labelTrailPrices() {
        document.querySelectorAll('.trail-option').forEach(option => {
            const span = option.querySelector("span");
            const price = option.dataset.price;
            if (span && !span.textContent.includes("Coins")) {
                span.textContent += ` – ${price} Coins`;
            }
        });
    }

    // Updates the state of all shop buttons (buy/equip/disabled)
    function updateShopButtons() {
        document.querySelectorAll('.trail-option').forEach(option => {
            const button = option.querySelector('button');
            const color = option.dataset.color;
            const price = parseInt(option.dataset.price);

            // Reset button styles
            button.style.backgroundColor = '';
            button.style.color = '';

            if (purchasedTrails.has(color)) {
                button.style.backgroundColor = 'blue';
                button.style.color = 'white';
                if (equippedTrail === color) {
                    button.textContent = "Equipped";
                    button.disabled = true;
                } else {
                    button.textContent = "Equip";
                    button.disabled = false;
                }
            } else {
                button.textContent = "Buy";
                button.disabled = coins < price;
            }
        });

        // Update spawn rate upgrade button
        if (spawnRateUpgradeBtn) {
            if (spawnRateUpgradeLevel >= UPGRADES.SPAWN_RATE.costs.length) {
                spawnRateUpgradeBtn.textContent = "Max Level";
                spawnRateUpgradeBtn.disabled = true;
            } else {
                const nextLevelCost = UPGRADES.SPAWN_RATE.costs[spawnRateUpgradeLevel];
                spawnRateUpgradeBtn.textContent = `Spawn Rate Upgrade (${nextLevelCost} Coins)`;
                spawnRateUpgradeBtn.disabled = coins < nextLevelCost;
            }
        }

        // Update initial coin boost button
        if (spawnBoostBtn) {
            if (spawnBoostPurchased) {
                spawnBoostBtn.textContent = "Boosted!";
                spawnBoostBtn.disabled = true;
            } else {
                spawnBoostBtn.textContent = `Initial Coin Boost (${GAME_SETTINGS.COIN_BOOST_PRICE} Coins)`;
                spawnBoostBtn.disabled = coins < GAME_SETTINGS.COIN_BOOST_PRICE;
            }
        }
    }

    // Logic for buying or equipping a trail
    function buyOrEquipTrail(color, price) {
        audio.buttonClickSound.play();
        if (!purchasedTrails.has(color)) {
            if (coins >= price) {
                coins -= price;
                purchasedTrails.add(color);
                updateCoinDisplay();
                applyTrailColor(color);
                updateShopButtons();
                checkForSecretTrail();

                // Achievement logic removed from here
                // if (GAME_DATA.TIER1_TRAIL_COLORS.includes(color)) {
                //     tier1TrailsPurchasedCount++;
                //     checkAchievements();
                // }
                showMessage(`Purchased ${color} Trail!`, "success");
            } else {
                showMessage("Not enough coins for this trail!", "error");
            }
        } else {
            applyTrailColor(color);
            updateShopButtons();
            showMessage(`Equipped ${color} Trail!`, "info");
        }
    }

    // Applies the selected trail's color and updates player speed based on tier
    function applyTrailColor(color) {
        currentTrailColor = color;
        equippedTrail = color;
        currentTrailColorTier = GAME_DATA.TRAIL_TIERS[color] || 0;

        speed = GAME_SETTINGS.BASE_SPEED; // Reset to base speed first
        if (isSpeedBoostActive) {
            speed *= 2; // Apply speed boost if active
        }

        // Apply speed based on trail tier
        if (color === 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)') {
            speed += 10; // Your desired speed boost for rainbow
        } else if (currentTrailColorTier >= 300) { // Diamond Trail
            speed += 6;
        } else if (currentTrailColorTier >= 250) { // Gold Trail
            speed += 5;
        } else if (currentTrailColorTier >= 100) { // White Trail
            speed += 4;
        } else if (currentTrailColorTier >= 50) { // Dark Tones
            speed += 3;
        } else if (currentTrailColorTier >= 10) { // Basic Hues
            speed += 2;
        }
    }

    // Checks if the secret rainbow trail should be unlocked
    function checkForSecretTrail() {
        const totalNonSecretTrails = document.querySelectorAll(".trail-option:not(.secret-trail)").length;
        if (purchasedTrails.size >= totalNonSecretTrails) {
            if (secretTrailElement && secretTrailElement.style.display !== "flex") {
                secretTrailElement.style.display = "flex";
                if (secretHeadingElement) {
                    secretHeadingElement.style.display = "block";
                }
                showMessage("Secret Rainbow Trail Unlocked!", "success");
            }
        }
    }

    // --- Event Listeners ---
    // Event listener for all trail option buttons using delegation
    if (trailOptionsContainer) {
        trailOptionsContainer.addEventListener("click", (e) => {
            const button = e.target.closest("button");
            // Ensure the click was on a button within a .trail-option
            if (button && button.closest(".trail-option")) {
                const option = button.closest(".trail-option");
                const color = option.dataset.color;
                const price = parseInt(option.dataset.price);
                buyOrEquipTrail(color, price);
            }
        });
    }

    if (spawnBoostBtn) {
        spawnBoostBtn.addEventListener("click", handleSpawnBoostClick);
    }

    if (spawnRateUpgradeBtn) {
        spawnRateUpgradeBtn.addEventListener("click", handleSpawnRateUpgradeClick);
    }

    // Hotkey to open/close save/load screen
    document.addEventListener("keydown", e => {
        keysHeld[e.key.toLowerCase()] = true;
        if (e.key.toLowerCase() === 'escape') { // 'Escape' key for save/load screen
            if (saveLoadScreen.style.display === "flex") {
                hideSaveLoadScreen();
            } else {
                showSaveLoadScreen();
            }
        }
    });
    document.addEventListener("keyup", e => keysHeld[e.key.toLowerCase()] = false);

    // Close Save/Load screen button listener
    if (closeSaveLoadScreenBtn) {
        closeSaveLoadScreenBtn.addEventListener("click", () => {
            audio.buttonClickSound.play();
            hideSaveLoadScreen();
        });
    }

    // --- Game Loop Functions ---
    let lastX = x, lastY = y; // Still tracking for consistency, but not for achievement
    function updatePosition() {
        horseRider.style.left = `${x}px`;
        horseRider.style.top = `${y}px`;

        // Distance calculation still happens, but not used for achievement
        const movedDistance = Math.sqrt(Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2));
        lastX = x;
        lastY = y;
        // checkAchievements(); // Call removed
    }

    // Checks if player is within the shop zone and toggles UI/sounds
    function checkShopZone() {
        // Use horseImg for accurate player position relative to collision detection
        const playerBox = horseImg.getBoundingClientRect();
        const shopBox = shopZone.getBoundingClientRect();
        const inside = !(
            playerBox.right < shopBox.left ||
            playerBox.left > shopBox.right ||
            playerBox.bottom < shopBox.top ||
            playerBox.top > shopBox.bottom
        );

        if (inside !== inShopLastFrame) {
            // Only toggle shopUI visibility if save/load screen is NOT open
            if (saveLoadScreen.style.display !== "flex") {
                 shopUI.style.display = inside ? "block" : "none";
            } else {
                 // If save screen is open, always ensure shop is hidden
                 shopUI.style.display = "none";
            }

            if (inside) {
                audio.shopOpenSound.play();
            } else {
                audio.shopCloseSound.play();
            }
            updateShopButtons();
        }
        inShopLastFrame = inside;
    }

    // Handles coin and power-up collision and collection/activation
    function checkRewardCollision() {
        // Use horseImg for accurate player collision
        const playerBox = horseImg.getBoundingClientRect();
        const expandedPlayerBox = {
            left: playerBox.left - GAME_SETTINGS.PLAYER_EXPANDED_COLLISION_BUFFER,
            right: playerBox.right + GAME_SETTINGS.PLAYER_EXPANDED_COLLISION_BUFFER,
            top: playerBox.top - GAME_SETTINGS.PLAYER_EXPANDED_COLLISION_BUFFER,
            bottom: playerBox.bottom + GAME_SETTINGS.PLAYER_EXPANDED_COLLISION_BUFFER
        };

        // Check for coin collisions
        document.querySelectorAll(".reward").forEach(reward => {
            const rewardBox = reward.getBoundingClientRect();
            const hit = !(
                expandedPlayerBox.right < rewardBox.left ||
                expandedPlayerBox.left > rewardBox.right ||
                expandedPlayerBox.bottom < rewardBox.top ||
                expandedPlayerBox.top > rewardBox.bottom
            );

            if (hit) {
                reward.remove();
                audio.coinSound.currentTime = 0;
                audio.coinSound.play();

                let coinMultiplier = 1;
                if (equippedTrail) {
                    if (equippedTrail === 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)') {
                        coinMultiplier = 20; // Specific multiplier for rainbow trail
                    } else {
                        const trailPrice = GAME_DATA.TRAIL_TIERS[equippedTrail];
                        coinMultiplier = GAME_DATA.COIN_MULTIPLIERS_BY_TIER[trailPrice] || 1;
                    }
                }
                if (isDoubleCoinActive) {
                    coinMultiplier *= 2;
                }

                const coinsGained = 1 * coinMultiplier;
                coins += coinsGained;
                // totalCoinsCollected removed as it was only for achievement
                updateCoinDisplay();
                // checkAchievements() removed
                showMessage(`+${coinsGained} Coins!`, "success");

                coinCounter.style.transform = "scale(1.2)";
                setTimeout(() => coinCounter.style.transform = "scale(1)", GAME_SETTINGS.COIN_ANIMATION_DURATION);
            }
        });

        // Coin Magnet Logic for existing coins
        if (isCoinMagnetActive) {
            document.querySelectorAll(".reward").forEach(reward => {
                const rewardRect = reward.getBoundingClientRect();
                const playerCenterX = playerBox.left + playerBox.width / 2;
                const playerCenterY = playerBox.top + playerBox.height / 2;
                const rewardCenterX = rewardRect.left + rewardRect.width / 2;
                const rewardCenterY = rewardRect.top + rewardRect.height / 2;

                const dx = playerCenterX - rewardCenterX;
                const dy = playerCenterY - rewardCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < GAME_SETTINGS.COIN_MAGNET_RADIUS) {
                    const speedFactor = 0.05;
                    const currentRewardLeft = parseFloat(reward.style.left);
                    const currentRewardTop = parseFloat(reward.style.top);
                    reward.style.left = `${currentRewardLeft + dx * speedFactor}px`;
                    reward.style.top = `${currentRewardTop + dy * speedFactor}px`;
                }
            });
        }

        // Power-up collision check
        document.querySelectorAll(".power-up").forEach(powerUp => {
            const powerUpBox = powerUp.getBoundingClientRect();
            const hit = !(
                expandedPlayerBox.right < powerUpBox.left ||
                expandedPlayerBox.left > powerUpBox.right ||
                expandedPlayerBox.bottom < powerUpBox.top ||
                expandedPlayerBox.top > powerUpBox.bottom
            );
            if (hit) {
                const typeClass = Array.from(powerUp.classList).find(cls => POWER_UP_ICONS.hasOwnProperty(cls));
                if (typeClass) {
                    activatePowerUp(typeClass);
                    powerUp.remove();
                }
            }
        });
    }

    // Unified function for spawning items (rewards/power-ups)
    function spawnItem(type, src, width, height, buffer) {
        const item = document.createElement("img");
        item.src = src;
        item.className = type;
        item.style.position = "absolute";
        item.style.width = `${width}px`;
        item.style.height = `${height}px`;

        const shopBox = shopZone.getBoundingClientRect();
        let xPos, yPos, attempts = 0;

        do {
            xPos = Math.random() * (window.innerWidth - width);
            yPos = Math.random() * (window.innerHeight - height);
            attempts++;
        } while (
            xPos + width > shopBox.left - buffer &&
            xPos < shopBox.right + buffer &&
            yPos + height > shopBox.top - buffer &&
            yPos < shopBox.bottom + buffer &&
            attempts < 100
        );

        item.style.left = `${xPos}px`;
        item.style.top = `${yPos}px`;
        document.body.appendChild(item);

        return item;
    }

    // Spawns a coin reward
    function spawnReward() {
        spawnItem("reward", "coin.png", 40, 40, GAME_SETTINGS.SPAWN_EXCLUSION_BUFFER_COIN);
    }

    // Spawns a random power-up
    function spawnPowerUp() {
        const powerUpTypes = Object.keys(POWER_UP_ICONS);
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        const iconSrc = POWER_UP_ICONS[randomType];

        const powerUp = spawnItem(`power-up ${randomType}`, iconSrc, 50, 50, GAME_SETTINGS.SPAWN_EXCLUSION_BUFFER_POWERUP);
    }

    // Activates a power-up and manages its duration
    const powerUpTimers = {}; // Object to store timers for each power-up type

    function activatePowerUp(type) {
        showMessage(`${type.replace('_', ' ').toUpperCase()} Activated!`, 'powerup');

        // Clear any existing timer for this power-up type to reset duration
        if (powerUpTimers[type]) {
            clearTimeout(powerUpTimers[type]);
        }

        switch (type) {
            case 'speed':
                isSpeedBoostActive = true;
                applyTrailColor(currentTrailColor); // Recalculate speed with boost
                break;
            case 'magnet':
                isCoinMagnetActive = true;
                break;
            case 'double_coin':
                isDoubleCoinActive = true;
                break;
        }

        // Set a new timer
        powerUpTimers[type] = setTimeout(() => {
            deactivatePowerUp(type);
            showMessage(`${type.replace('_', ' ').toUpperCase()} Ended.`, 'info');
            powerUpTimers[type] = null; // Clear the timer reference
        }, GAME_SETTINGS.POWER_UP_DURATION_MS);
    }

    function deactivatePowerUp(type) {
        switch (type) {
            case 'speed':
                isSpeedBoostActive = false;
                applyTrailColor(currentTrailColor); // Reset speed
                break;
            case 'magnet':
                isCoinMagnetActive = false;
                break;
            case 'double_coin':
                isDoubleCoinActive = false;
                break;
        }
    }

    // checkAchievements function removed entirely

    // Main game loop
    function gameLoop() {
        if (!isGamePaused) { // Only run game logic if not paused
            // Player movement
            if (keysHeld["w"]) y -= speed;
            if (keysHeld["s"]) y += speed;
            if (keysHeld["a"]) {
                x -= speed;
                horseRider.style.transform = "scaleX(1)";
            }
            if (keysHeld["d"]) {
                x += speed;
                horseRider.style.transform = "scaleX(-1)";
            }

            // Screen wrap
            if (x < -horseRider.offsetWidth) x = window.innerWidth;
            if (x > window.innerWidth) x = -horseRider.offsetWidth;
            if (y < -horseRider.offsetHeight) y = window.innerHeight;
            if (y > window.innerHeight) y = -horseRider.offsetHeight;

            updatePosition();
            checkShopZone();
            checkRewardCollision(); // This now also handles magnet logic and power-up collisions

            // Trail rendering
            if (currentTrailColor && (keysHeld["w"] || keysHeld["a"] || keysHeld["s"] || keysHeld["d"])) {
                const trail = document.createElement("div");
                trail.className = "trail-piece";
                trail.style.background = currentTrailColor;
                // Adjust position to center trail under horseImg, relative to horseRider's position
                trail.style.left = `${x + horseImg.offsetWidth / 2 - (10 / 2)}px`; // 10 is assumed trail piece width
                trail.style.top = `${y + horseImg.offsetHeight / 2 - (10 / 2)}px`; // 10 is assumed trail piece height
                document.body.appendChild(trail);

                setTimeout(() => {
                    trail.style.opacity = "0";
                    setTimeout(() => trail.remove(), GAME_SETTINGS.TRAIL_PIECE_REMOVE_DELAY);
                }, GAME_SETTINGS.TRAIL_PIECE_FADE_OUT_DELAY);
            }
        }
        requestAnimationFrame(gameLoop);
    }

    // --- Initialization ---
    function initializeGame() {
        // Start intervals immediately for smooth background operations
        // These will be cleared and reset by applySpawnRateUpgrade on load
        spawnInterval = setInterval(spawnReward, coinSpawnRate);
        powerUpSpawnInterval = setInterval(spawnPowerUp, GAME_SETTINGS.POWER_UP_SPAWN_INTERVAL_MS);

        // Initial load (e.g., from slot 0, or show save screen directly)
        loadGameFromSlot(0); // Attempt to load from slot 1 on game start

        // Ensure all UI elements reflect loaded/initial state
        updateCoinDisplay();
        labelTrailPrices();
        updateShopButtons();
        updatePosition(); // Set initial player position on screen

        // Start background music (handle autoplay policy)
        audio.bgMusic.play().catch(e => console.error("Failed to play background music:", e));

        // Start the main game loop
        gameLoop();
    }

    // Start the game after all setup is complete
    initializeGame();
}