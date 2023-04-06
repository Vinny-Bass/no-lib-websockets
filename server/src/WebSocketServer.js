import crypto from "node:crypto";

const WEBSOCKET_MAGIC_STRING_KEY = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const SEVEN_BITS_INTEGER_MARKER = 125 // as byte: 01111101
const SIXTEEN_BITS_INTEGER_MARKER = 126 // as byte: 01111110
const SIXTYFOUR_BITS_INTEGER_MARKER = 127 // as byte: 01111111
const FIRST_BIT = 128


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

  onSocketReadable(socket) {
    socket.read(1) // reads and discards the first message byte
    const [markerAndPayloadLength] = socket.read(1) // this gets the integer representation for each bit
    const lengthIndicatorInBits = markerAndPayloadLength - FIRST_BIT

    let messageLength = 0
    console.log({ markerAndPayloadLength })
  }

  onSocketUpgrade(req, socket, head) {
    const { "sec-websocket-key": webClientSocketKey } = req.headers;
    const response = this.prepareHandshakeResponse(webClientSocketKey);
    socket.write(response);

    socket.on("readable", () => this.onSocketReadable(socket))
  }
}

export default WebSocketServer;