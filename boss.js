document.addEventListener("DOMContentLoaded", () => {
    const sequenceDisplay = document.getElementById("sequence");
    const message = document.getElementById("message");
    const bossHealth = document.getElementById("bossHealth");
    const playerHealth = document.getElementById("playerHealth");
    const victoryScreen = document.getElementById("victoryScreen");
    const restartButton = document.getElementById("restartButton");
    const playerImage = document.getElementById("playerImage");
    const bossImage = document.getElementById("bossImage");

    const possibleKeys = ["w", "a", "s", "d"];
    let correctSequence = [];
    let playerInput = [];
    let positionY = 50;
    
    let bossHP = 100;
    let playerHP = 100;
    const fallingSpeed = 0.25;

    function generateSequence() {
        correctSequence = Array.from({ length: 4 }, () =>
            possibleKeys[Math.floor(Math.random() * possibleKeys.length)]
        );
        sequenceDisplay.innerText = correctSequence.join(" ");
        positionY = 50;
    }

    function moveSequenceDown() {
        if (bossHP <= 0 || playerHP <= 0) return; 

        positionY += fallingSpeed;
        sequenceDisplay.style.top = `${positionY}px`;

        if (positionY >= window.innerHeight - 100) {
            playerHP -= 20;
            playerHealth.style.width = `${playerHP}%`;
            message.innerText = "You took damage!";
            checkGameStatus();
            resetGame();
        } else {
            requestAnimationFrame(moveSequenceDown);
        }
    }

    function checkGameStatus() {
        if (playerHP <= 0) {
            message.innerText = "Game Over! You lost.";
            setTimeout(() => window.location.reload(), 3000);
        } else if (bossHP <= 0) {
            message.innerText = "You defeated the boss!";
            victoryScreen.classList.remove("hidden");
        }
    }

    function resetGame() {
        setTimeout(() => {
            if (bossHP > 0 && playerHP > 0) { 
                message.innerText = "Type fast to survive!";
                generateSequence();
                moveSequenceDown();
            }
        }, 2000);
    }

    document.addEventListener("keydown", (event) => {
        playerInput.push(event.key);

        if (playerInput.length > correctSequence.length) {
            playerInput.shift();
        }

        if (JSON.stringify(playerInput) === JSON.stringify(correctSequence)) {
            bossHP -= 20;
            bossHealth.style.width = `${bossHP}%`;
            message.innerText = "Boss takes damage!";

            playerImage.classList.add("attack");
            setTimeout(() => {
                playerImage.classList.remove("attack");
                bossImage.classList.add("boss-hit");
                setTimeout(() => bossImage.classList.remove("boss-hit"), 200);
            }, 300);

            generateSequence();
            moveSequenceDown();
            checkGameStatus();
        }
    });

    restartButton.addEventListener("click", () => {
        window.location.reload();
    });

    generateSequence();
    moveSequenceDown();
});
