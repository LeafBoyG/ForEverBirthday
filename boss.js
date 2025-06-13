document.addEventListener("DOMContentLoaded", () => {
    const sequenceDisplay = document.getElementById("sequence");
    const playerTypedDisplay = document.getElementById("playerTyped");
    const message = document.getElementById("message");
    const bossHealth = document.getElementById("bossHealth");
    const playerHealth = document.getElementById("playerHealth");
    const playerImage = document.getElementById("playerImage");
    const bossImage = document.getElementById("bossImage");
    const virtualKeyboard = document.getElementById("virtualKeyboard");
    const keys = document.querySelectorAll(".key");
    const removeKeyButton = document.getElementById("removeKey");

    // Get the try again screen elements
    const tryAgainScreen = document.getElementById("tryAgainScreen");
    const tryMessage = document.getElementById("tryMessage");
    const retryBossButton = document.getElementById("retryBoss");
    const continueGameButton = document.getElementById("continueGame");


    const possibleKeys = ["w", "a", "s", "d"];
    let correctSequence = [];
    let playerInput = [];
    let positionY = 50; // Initial top position for the sequence
    
    let bossHP = 100;
    let playerHP = 100;
    
    let gameActive = true; // Flag to control game state (running or paused)

    const device = localStorage.getItem("device") || "pc"; 
    const fallingSpeed = device === "mobile" ? 0.2 : 0.4;

    if (device === "pc") {
        virtualKeyboard.style.display = "none";
    }

    function generateSequence() {
        correctSequence = Array.from({ length: 4 }, () =>
            possibleKeys[Math.floor(Math.random() * possibleKeys.length)]
        );
        sequenceDisplay.innerText = "Sequence: " + correctSequence.join(" ");
        playerInput = [];
        playerTypedDisplay.innerText = "Typed: ";
        positionY = 50; // Reset position for new sequence
        sequenceDisplay.style.top = `${positionY}px`; // Apply initial position
    }

    function moveSequenceDown() {
        // Only move the sequence if the game is active
        if (!gameActive) {
            return;
        }

        positionY += fallingSpeed;
        sequenceDisplay.style.top = `${positionY}px`;

        // Check if sequence hit the bottom
        // Adjusted to be relative to the game container, or a more reliable bottom boundary
        if (positionY >= window.innerHeight - sequenceDisplay.offsetHeight - 50) { // Example adjustment
            playerHP -= 20;
            playerHealth.style.width = `${playerHP}%`;
            message.innerText = "You took damage!";
            checkGameStatus(); // Check if player lost after taking damage
            if (gameActive) { // Only generate new sequence if game is still active (player didn't lose)
                generateSequence();
                // We don't call moveSequenceDown here immediately, requestAnimationFrame will
                // ensure it continues if gameActive remains true
            }
        }
        requestAnimationFrame(moveSequenceDown); // Continue the animation loop
    }

    function checkGameStatus() {
        if (playerHP <= 0) {
            message.innerText = "Game Over! You lost.";
            tryMessage.innerText = "Game Over! You lost.";
            retryBossButton.style.display = "inline-block"; // Show retry
            continueGameButton.style.display = "none"; // Hide continue
            tryAgainScreen.classList.remove("hidden");
            gameActive = false; // Stop the game
        } else if (bossHP <= 0) {
            message.innerText = "You defeated the boss!";
            tryMessage.innerText = "Boss Defeated! What's next?";
            retryBossButton.style.display = "none"; // Hide retry
            continueGameButton.style.display = "inline-block"; // Show continue
            tryAgainScreen.classList.remove("hidden");
            gameActive = false; // Stop the game
        }
    }

    function resetGame() {
        bossHP = 100;
        playerHP = 100;
        bossHealth.style.width = "100%";
        playerHealth.style.width = "100%";
        message.innerText = "Type fast to survive!";
        generateSequence(); // Generate a new sequence for the fresh start
        gameActive = true; // Set game to active
        // No need to call moveSequenceDown here, the initial call or retry will handle it
    }

    // New unified input handling function
    function handleInput(key) {
        if (!gameActive) return; // Don't process input if game is not active

        if (key === "Backspace" || key === "-") { // '-' is for virtual keyboard's remove button
            playerInput.pop();
        } else if (possibleKeys.includes(key)) {
            playerInput.push(key);
        }

        playerTypedDisplay.innerText = "Typed: " + playerInput.join(" ");

        // Trim input if it exceeds sequence length (important for player corrections)
        if (playerInput.length > correctSequence.length) {
            playerInput.shift(); 
        }

        // Check for sequence match ONLY when input length matches the correct sequence length
        if (playerInput.length === correctSequence.length && JSON.stringify(playerInput) === JSON.stringify(correctSequence)) {
            bossHP -= 20;
            bossHealth.style.width = `${bossHP}%`;
            message.innerText = "Boss takes damage!";

            // Player attack animation
            playerImage.classList.add("attack");
            setTimeout(() => playerImage.classList.remove("attack"), 300);
            // Boss hit animation
            bossImage.classList.add("boss-hit");
            setTimeout(() => bossImage.classList.remove("boss-hit"), 300);
            
            checkGameStatus(); // Check game status AFTER boss takes damage

            if (gameActive) { // Only generate new sequence if the game is still active (boss wasn't defeated)
                generateSequence();
            }
        }
    }

    // Event Listeners for Keyboard and Virtual Keyboard
    document.addEventListener("keydown", (event) => {
        handleInput(event.key);
    });

    keys.forEach(key => {
        key.addEventListener("click", () => {
            handleInput(key.dataset.key);
        });
    });

    removeKeyButton.addEventListener("click", () => {
        handleInput("-"); // Simulate a backspace for the virtual remove button
    });

    // Event listeners for the tryAgainScreen buttons
    retryBossButton.addEventListener("click", () => {
        tryAgainScreen.classList.add("hidden"); // Hide the screen
        resetGame(); // Reset game state
        moveSequenceDown(); // Restart the falling sequence animation
    });

    continueGameButton.addEventListener("click", () => {
        window.location.href = "collection.html"; // Navigate to the next page
    });

    // Initial game setup
    generateSequence();
    moveSequenceDown(); // Start the sequence falling
});
document.getElementById("playAgain").addEventListener("click", () => {
    window.location.href = "selection.html"; // Redirect to the starting page
});
