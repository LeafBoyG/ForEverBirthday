document.addEventListener("DOMContentLoaded", () => {
    const img = document.getElementById("movingImage");
    const startButton = document.getElementById("startBossFight");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    const speed = 10;

    document.addEventListener("keydown", (event) => {
        switch (event.key) {
            case "w": y -= speed; break; 
            case "s": y += speed; break; 
            case "a": x -= speed; break;
            case "d": x += speed; break;
        }
        img.style.left = `${x}px`;
        img.style.top = `${y}px`;
    });

    startButton.addEventListener("click", () => {
        window.location.href = "selection.html"; // Redirect to boss fight page
    });
});
