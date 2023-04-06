import crypto from "node:crypto";

const WEBSOCKET_MAGIC_STRING_KEY = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

class WebSocketServer {
  constructor() {
    this.connections = new Set();
  }

  createSocketAccept(id) {
    const hash = crypto.createHash("sha1");
    hash.update(id + WEBSOCKET_MAGIC_STRING_KEY);
    return hash.digest('base64');
  }

  prepareHandshakeResponse(id) {
    const acceptKey = this.createSocketAccept(id);

    return [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      ''
    ].map(line => line.concat('\r\n')).join('');
  }

  onSocketUpgrade(req, socket, head) {
    const { 'sec-websocket-key': webClientSocketKey } = req.headers;
    const response = this.prepareHandshakeResponse(webClientSocketKey);
    socket.write(response);
  }
}

export default WebSocketServer;