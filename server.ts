import express from "express";
import { Server } from "socket.io";
import path from "path";

const port = process.env.PORT || 8080;

const app = express();
const exs = require("http").createServer(app).listen(port, () => {
    console.log(`🚀 Server started on port ${port}!`);
});
const sio = new Server(exs);

app.set("views", path.join(__dirname, "/client/views"));
app.use(express.static(__dirname + '/client/public'));

let connections: any = {};

sio.on("connection", (io) => {
    console.log(`🤖 Session ${io.id} started!`);
    connections[io.id] = {
        x: 0, y: 0,
        r: 255, g: 0, b: 0
    };

    io.on("clientUpdate", (data) => {
        connections[io.id] = data;
        io.emit("serverUpdate", connections);
    });

    io.on("disconnect", () => {
        console.log(`❌ Session ${io.id} ended!`);
        delete connections[io.id];
    });
});

app.get("/", (req, res) => { res.render("index.ejs") });