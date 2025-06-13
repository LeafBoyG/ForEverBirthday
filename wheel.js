document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("wheelCanvas");
    const ctx = canvas.getContext("2d");
    const spinButton = document.getElementById("spinButton");

    // Define wheel segments
    const segments = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Ultra Rare (0.1%)"];
    const numSegments = segments.length;
    let angle = 0;
    let spinning = false;

    // Draw the wheel
    function drawWheel() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const segmentAngle = (2 * Math.PI) / numSegments;

        segments.forEach((segment, i) => {
            ctx.beginPath();
            ctx.moveTo(150, 150);
            ctx.arc(150, 150, 140, i * segmentAngle, (i + 1) * segmentAngle);
            ctx.fillStyle = i % 2 === 0 ? "lightblue" : "yellow";
            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.translate(150, 150);
            ctx.rotate(i * segmentAngle + segmentAngle / 2);
            ctx.fillStyle = "black";
            ctx.font = "16px Arial";
            ctx.fillText(segment, 60, 0);
            ctx.restore();
        });
    }

    // Spin the wheel (rigged to always land on 0.1%)
    function spinWheel() {
        if (spinning) return;

        spinning = true;
        let spins = 30;
        let spinSpeed = 12;
        const winningAngle = (5 / numSegments) * 360; // Always lands on "Ultra Rare (0.1%)"

        function animateSpin() {
            if (spins > 0) {
                angle += spinSpeed;
                spinSpeed *= 0.98;
                canvas.style.transform = `rotate(${angle}deg)`;
                spins--;
                requestAnimationFrame(animateSpin);
            } else {
                spinning = false;
                angle = winningAngle; // Force landing on the rarest segment
                canvas.style.transform = `rotate(${angle}deg)`;
                alert("You won: Ultra Rare (0.1%)!");
            }
        }

        animateSpin();
    }

    spinButton.addEventListener("click", spinWheel);
    drawWheel();
});
