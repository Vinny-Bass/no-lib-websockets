import { createServer } from 'node:http';
import WebSocketServer from './WebSocketServer.js';

const PORT = 1337;

const server = createServer((req, res) => {
  res.writeHead(200);
}).listen(PORT, () => console.log("Server running on port ", PORT));

const webSocketServer = new WebSocketServer();
server.on('upgrade', (req, socket, head) => webSocketServer.onSocketUpgrade(req, socket, head));

[
  "uncaughtException",
  "unhandledRejection"
].forEach(event =>
  process.on(event, (err) => {
    console.error(`something bad happened: ${event}, msg: ${err.stack || err}`)
  })
);
