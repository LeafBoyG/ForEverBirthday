document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("wheelCanvas");
    const ctx = canvas.getContext("2d");
    const spinButton = document.getElementById("spinButton");

    const segments = ["Gold", "Silver", "Bronze", "Jackpot", "Bonus", "Mystery", "Ultra Rare (0.1%)"];
    const colors = ["#FFD700", "#C0C0C0", "#CD7F32", "#FF5722", "#03A9F4", "#8E24AA", "#FF0000"];
    const numSegments = segments.length;

    let angle = 0;
    let spinning = false;

    function drawWheel() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const segmentAngle = (2 * Math.PI) / numSegments;

        for (let i = 0; i < numSegments; i++) {
            // Segment background
            ctx.beginPath();
            ctx.moveTo(200, 200);
            ctx.arc(200, 200, 180, i * segmentAngle, (i + 1) * segmentAngle);
            ctx.fillStyle = colors[i];
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Segment text
            ctx.save();
            ctx.translate(200, 200);
            ctx.rotate(i * segmentAngle + segmentAngle / 2);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "center";
            ctx.fillText(segments[i], 110, 10);
            ctx.restore();
        }
    }

    function spinWheel() {
        if (spinning) return;

        spinning = true;
        let spins = 120;
        let spinSpeed = 25;

        const segmentSize = 360 / numSegments;
        const ultraRareIndex = segments.length - 1;
        const targetAngle = ultraRareIndex * segmentSize + segmentSize / 2;
        const fullRotations = 5 * 360;
        const finalAngle = fullRotations + targetAngle;

        function animateSpin() {
            if (spins > 0) {
                angle += spinSpeed;
                spinSpeed *= 0.985;
                canvas.style.transform = `rotate(${angle}deg)`;
                spins--;
                requestAnimationFrame(animateSpin);
            } else {
                spinning = false;
                angle = finalAngle;
                canvas.style.transform = `rotate(${finalAngle}deg)`;
                alert(`🎉 You won: ${segments[ultraRareIndex]}!`);
            }
        }

        animateSpin();
    }

    spinButton.addEventListener("click", spinWheel);
    drawWheel();
});
