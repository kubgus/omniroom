const express = require("express");
const { Server } = require("socket.io");
const path = require("path");

const port = process.env.PORT || 8080;

const app = express();
const exs = require("http").createServer(app).listen(port, () => {
    console.log(`🚀 Server started on port ${port}!`);
});
const sio = new Server(exs);

app.set("views", path.join(__dirname, "/client/views"));
app.use(express.static(__dirname + '/client/public'));

let connections: any = {};

const sendServerMessage = (r: number, g: number, b: number, message: string) => {
    sio.emit("systemMessage", { r, g, b, message });
}

sio.on("connection", (io: any) => {
    console.log(`🤖 Session ${io.id} started!`);
    connections[io.id] = {
        n: "", x: 0, y: 0,
        r: 0, g: 0, b: 0
    };

    let joinMessageSent = false;

    io.on("clientUpdate", (data: any) => {
        connections[io.id] = data;
        if (!joinMessageSent) {
            joinMessageSent = true;
            sendServerMessage(0, 200, 0, `${connections[io.id].n.length > 0 ? connections[io.id].n : "Guest"} joined the game.`);
        }
        io.emit("serverUpdate", connections);
    });

    io.on("chatMessage", (data: any) => {
        sio.emit("chatMessage", data);
    });

    io.on("disconnect", () => {
        sendServerMessage(200, 0, 0, `${connections[io.id].n.length > 0 ? connections[io.id].n : "Guest"} left the game.`);
        console.log(`❌ Session ${io.id} ended!`);
        delete connections[io.id];
    });
});

app.get("/", (req: any, res: any) => { res.render("index.ejs") });