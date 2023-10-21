const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Global constants
const PLAYER_SPEED = 5;

// Global default player variables
let x = 0;
let y = 0;
let r = Math.random() * 255;
let g = Math.random() * 255;
let b = Math.random() * 255;
let size = 25;

// Global default client variables
let coff_x = 0; // camera offset
let coff_y = 0; // camera offset

// Handle keyboard input
let up = false;
let down = false;
let left = false;
let right = false;
document.addEventListener("keydown", (event) => {
    if (event.key === "w") up = true;
    if (event.key === "s") down = true;
    if (event.key === "a") left = true;
    if (event.key === "d") right = true;
}, false);
document.addEventListener("keyup", (event) => {
    if (event.key === "w") up = false;
    if (event.key === "s") down = false;
    if (event.key === "a") left = false;
    if (event.key === "d") right = false;
}, false);
const TouchControl = (event) => {
    const touch = event.touches[0];
    if (touch.clientY < window.innerHeight / 3) up = true;
    if (touch.clientY > window.innerHeight - window.innerHeight / 3) down = true;
    if (touch.clientX < window.innerWidth / 3) left = true;
    if (touch.clientX > window.innerWidth - window.innerWidth / 3) right = true;
}
document.addEventListener("touchstart", TouchControl, false);
document.addEventListener("touchmove", TouchControl, false);
document.addEventListener("touchend", (event) => {
    up = false;
    down = false;
    left = false;
    right = false;
}, false);
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('mousedown', event => event.preventDefault());

socket.on("serverUpdate", (connections) => {
    // Update the canvas size
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw all the connections
    for (const id in connections) {
        const connection = connections[id];
        ctx.fillStyle = `rgb(${connection.r}, ${connection.g}, ${connection.b})`;
        ctx.fillRect(connection.x - coff_x, connection.y - coff_y, size, size);
    }
});

const SendToServer = () => {
    socket.emit("clientUpdate", { x, y, r, g, b })
}

const UpdatePlayerValues = () => {
    // Update player position
    if (up) y -= PLAYER_SPEED;
    if (down) y += PLAYER_SPEED;
    if (left) x -= PLAYER_SPEED;
    if (right) x += PLAYER_SPEED;

    // Update camera offset
    coff_x = x - window.innerWidth / 2;
    coff_y = y - window.innerHeight / 2;

    try {
        // Update HUD info
        document.getElementById("x").innerText = x;
        document.getElementById("y").innerText = y;
    } catch (e) { }
}

const GameLoop = () => {
    UpdatePlayerValues();
    SendToServer();
    requestAnimationFrame(GameLoop);
}
// Initial call to the game loop
GameLoop();