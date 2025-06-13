document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("wheelCanvas");
    const ctx = canvas.getContext("2d");
    const spinButton = document.getElementById("spinButton");

    // Wheel Segments & Colors
    const segments = ["Gold", "Silver", "Bronze", "Jackpot", "Bonus", "Mystery", "Ultra Rare"];
    const colors = ["#FFD700", "#C0C0C0", "#CD7F32", "#FF5722", "#03A9F4", "#8E24AA", "#FF0000"];
    const numSegments = segments.length;
    let angle = 0;
    let spinning = false;

    function drawWheel() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const segmentAngle = (2 * Math.PI) / numSegments;

        for (let i = 0; i < numSegments; i++) {
            ctx.beginPath();
            ctx.moveTo(200, 200);
            ctx.arc(200, 200, 180, i * segmentAngle, (i + 1) * segmentAngle);
            ctx.fillStyle = colors[i];
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.translate(200, 200);
            ctx.rotate(i * segmentAngle + segmentAngle / 2);
            ctx.fillStyle = "#FFF";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "center";
            ctx.fillText(segments[i], 100, 10);
            ctx.restore();
        }
    }

    function spinWheel() {
        if (spinning) return;

        spinning = true;
        let spins = 30;
        let spinSpeed = 10;
        const finalAngle = Math.floor(Math.random() * 360); // Random final position

        function animateSpin() {
            if (spins > 0) {
                angle += spinSpeed;
                spinSpeed *= 0.98;
                canvas.style.transform = `rotate(${angle}deg)`;
                spins--;
                requestAnimationFrame(animateSpin);
            } else {
                spinning = false;
                canvas.style.transform = `rotate(${finalAngle}deg)`;

                const winningIndex = Math.floor((finalAngle % 360) / (360 / numSegments));
                alert(`You won: ${segments[winningIndex]}!`);
            }
        }

        animateSpin();
    }

    spinButton.addEventListener("click", spinWheel);
    drawWheel();
});
