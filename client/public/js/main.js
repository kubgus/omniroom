const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let x = 0;
let y = 0;
let r = Math.random() * 255;
let g = Math.random() * 255;
let b = Math.random() * 255;

document.addEventListener("keypress", (event) => {
    const speed = 10;
    if (event.key === "w") {
        y -= speed;
    }
    if (event.key === "a") {
        x -= speed;
    }
    if (event.key === "s") {
        y += speed;
    }
    if (event.key === "d") {
        x += speed;
    }
});

socket.on("serverUpdate", (connections) => {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const id in connections) {
        const connection = connections[id];
        ctx.fillStyle = `rgb(${connection.r}, ${connection.g}, ${connection.b})`;
        ctx.fillRect(connection.x, connection.y, 50, 50);
    }
});

const SendToServer = () => {
    socket.emit("clientUpdate", { x, y, r, g, b })
}

const GameLoop = () => {
    SendToServer();
    requestAnimationFrame(GameLoop);
}
// Initial call to the game loop
GameLoop();