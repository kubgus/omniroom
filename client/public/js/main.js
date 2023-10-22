const socket = io();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Global constants
const PLAYER_SPEED = 5;
const PLAYER_SIZE = 25;
const PLAYER_LINE_RADIUS = screen.height / 4;
const PLAYER_DRAW_WIDTH = 5;
const CHAT_DURATION = 30; // seconds

// Global default player variables
let n = "";
let h = 100; // health
let m = 0; // money
let x = 0;
let y = 0;
let r = Math.random() * 255;
let g = Math.random() * 255;
let b = Math.random() * 255;

// Get username from local storage
if (localStorage.getItem("username")) document.getElementById("n").value = localStorage.getItem("username");
// Set color picker to random color
document.getElementById("rgb").value = `#${Math.floor(r).toString(16)}${Math.floor(g).toString(16)}${Math.floor(b).toString(16)}`;

// Create a world variable for storing the world (drawings, etc.)
let world = []; // list of paths of this user
let globe = {}; // list of paths of all users exccpet the current user
let coloredPaths = false;

// Global default client variables
let coff_x = 0; // camera offset
let coff_y = 0; // camera offset

// Handle keyboard input
let up = false;
let down = false;
let left = false;
let right = false;
let showTouchControls = "ontouchstart" in document.documentElement;
document.addEventListener("keydown", (event) => {
    if (document.activeElement.tagName === "INPUT") return; // Don't move if typing in input 
    if (event.key === "w") up = true;
    if (event.key === "s") down = true;
    if (event.key === "a") left = true;
    if (event.key === "d") right = true;
    if (event.key === "t") showTouchControls = !showTouchControls;
    if (event.key === "c") coloredPaths = !coloredPaths;
}, false);
document.addEventListener("keyup", (event) => {
    if (event.key === "w") up = false;
    if (event.key === "s") down = false;
    if (event.key === "a") left = false;
    if (event.key === "d") right = false;
}, false);
// Touch control
document.getElementById("up").addEventListener("touchstart", () => up = true, false);
document.getElementById("up").addEventListener("touchend", () => up = false, false);
document.getElementById("down").addEventListener("touchstart", () => down = true, false);
document.getElementById("down").addEventListener("touchend", () => down = false, false);
document.getElementById("left").addEventListener("touchstart", () => left = true, false);
document.getElementById("left").addEventListener("touchend", () => left = false, false);
document.getElementById("right").addEventListener("touchstart", () => right = true, false);
document.getElementById("right").addEventListener("touchend", () => right = false, false);
document.addEventListener('contextmenu', event => event.preventDefault());

const IsMe = (_n, _x, _y) => {
    return _n === n && _x === x && _y === y;
}

const MoveTowards = (x1, y1, x2, y2, step) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const x = x1 + step * Math.cos(angle);
    const y = y1 + step * Math.sin(angle);
    return { x, y };
}

socket.on("serverUpdate", (connections) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw all the connections
    for (const id in connections) {
        const connection = connections[id];
        // Draw the player world modifications
        ctx.lineWidth = PLAYER_DRAW_WIDTH;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        const paths = { ...globe, ...{ [socket.id]: world } };
        if (paths[id])
            for (const path of paths[id]) {
                if (path == null) continue;
                ctx.beginPath();
                if (coloredPaths) ctx.strokeStyle = `rgb(${path.r}, ${path.g}, ${path.b})`;
                else ctx.strokeStyle = "lightgray";
                for (const data of path.d) {
                    ctx.lineTo(data.x - coff_x, data.y - coff_y);
                }
                ctx.stroke();
                ctx.closePath();
            }
        // Draw the player
        if (connection.x - coff_x < 0 || connection.x - coff_x > window.innerWidth || connection.y - coff_y < 0 || connection.y - coff_y > window.innerHeight) {
            // Draw line to player when they are off screen
            let lineStart = MoveTowards(x - coff_x + PLAYER_SIZE / 2, y - coff_y + PLAYER_SIZE / 2,
                connection.x - coff_x + PLAYER_SIZE / 2, connection.y - coff_y + PLAYER_SIZE / 2, PLAYER_LINE_RADIUS);
            ctx.beginPath();
            ctx.moveTo(lineStart.x, lineStart.y);
            ctx.lineTo(connection.x - coff_x + PLAYER_SIZE / 2, connection.y - coff_y + PLAYER_SIZE / 2);
            ctx.strokeStyle = `rgb(${connection.r}, ${connection.g}, ${connection.b})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        } else {
            // Draw player rectangle
            ctx.fillStyle = `rgb(${connection.r}, ${connection.g}, ${connection.b})`;
            ctx.fillRect(connection.x - coff_x, connection.y - coff_y, PLAYER_SIZE, PLAYER_SIZE);
            // Draw the player name
            ctx.font = "15px monospace";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            //if (IsMe(connection.n, connection.x, connection.y)) ctx.fillStyle = "lime";
            if (connection.n.length < 1) connection.n = "Guest";
            if (connection.n.length > 20) connection.n = `${connection.n.substring(0, 17)}...`;
            ctx.fillText(connection.n, connection.x - coff_x + PLAYER_SIZE / 2, connection.y - coff_y - 5);
        }
    }
});

const SendToServer = () => {
    socket.emit("clientUpdate", { n, x, y, r, g, b })
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
        // Update info based on settings
        n = document.getElementById("n").value;
        if (n.length > 0) localStorage.setItem("username", n);
        else if (localStorage.getItem("username")) localStorage.removeItem("username");
        r = parseInt(document.getElementById("rgb").value.substring(1, 3), 16);
        g = parseInt(document.getElementById("rgb").value.substring(3, 5), 16);
        b = parseInt(document.getElementById("rgb").value.substring(5, 7), 16);
        // Update HUD info
        document.getElementById("h").innerHTML = h;
        document.getElementById("m").innerHTML = m;
        document.getElementById("x").innerText = x;
        document.getElementById("y").innerText = y;
        // Update touch controls
        if (showTouchControls) document.getElementById("mobile").style.display = "flex";
        else document.getElementById("mobile").style.display = "none";
    } catch (e) { }
}

const GameLoop = () => {
    UpdatePlayerValues();
    SendToServer();

    socket.emit("clientRequestWorld") // Request world from server

    requestAnimationFrame(GameLoop);
}
// Initial call to the game loop
GameLoop();

const SendChatMessage = (event) => {
    const message = document.getElementById("message").value;
    if (message.length > 0) socket.emit("chatMessage", { n, r, g, b, message });
    document.getElementById("message").value = "";
    // Lose focus on input after sending message
    document.getElementById("message").blur();
}
document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") SendChatMessage();
}, false);
document.getElementById("send").addEventListener("click", SendChatMessage, false);

const displayGenericChatMessage = (span) => {
    document.getElementById("messages").insertBefore(span, document.getElementById("messages").firstChild);
    return setTimeout(() => {
        span.remove();
    }, CHAT_DURATION * 1000);
}

socket.on("chatMessage", (data) => {
    const username = document.createElement("span");
    username.style.color = `rgb(${data.r}, ${data.g}, ${data.b})`;
    username.innerText = data.n;
    const message = document.createElement("span");
    message.innerText = data.message;
    const span = document.createElement("span");
    span.appendChild(username);
    span.appendChild(document.createTextNode(": "));
    span.appendChild(message);
    displayGenericChatMessage(span);
});

socket.on("systemMessage", (data) => {
    const span = document.createElement("span");
    span.style.color = `rgb(${data.r}, ${data.g}, ${data.b})`;
    span.innerText = data.message;
    displayGenericChatMessage(span);
});

// Draw on canvas
let drawing = false;
let pathId = 0;

canvas.addEventListener('mousedown', () => drawing = true, false);
canvas.addEventListener('touchstart', (event) => {
    drawing = true;
    event.preventDefault();
}, false);

const DrawEnd = () => {
    drawing = false;
    pathId++;
}
canvas.addEventListener('mouseup', () => DrawEnd(), false);
canvas.addEventListener('touchend', () => DrawEnd(), false);

const UpdateLocalWorld = (event) => {
    if (!drawing) return;
    const data = {
        x: (event.clientX ?? event.touches[0].clientX) + coff_x,
        y: (event.clientY ?? event.touches[0].clientY) + coff_y
    }
    if (world[pathId]) world[pathId].d.push({ x: data.x, y: data.y });
    else world[pathId] = { d: [{ x: data.x, y: data.y }], r, g, b };
}
canvas.addEventListener('mousemove', UpdateLocalWorld, false);
canvas.addEventListener('touchmove', UpdateLocalWorld, false);

socket.on("serverRequestWorld", (recipient) => {
    socket.emit("clientReturnWorld", { recipient, world });
});

socket.on("serverReturnWorld", (data) => {
    globe[data.sender] = data.world;
});
