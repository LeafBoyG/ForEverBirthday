document.querySelectorAll(".collectible").forEach(item => {
    item.addEventListener("click", () => {
        alert("You collected a " + item.dataset.item);
        item.style.opacity = "0";
    });
});

document.getElementById("backToGame").addEventListener("click", () => {
    window.location.href = "boss.html";
});
