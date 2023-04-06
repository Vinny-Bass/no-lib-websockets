import crypto from "node:crypto";

const WEBSOCKET_MAGIC_STRING_KEY = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const SEVEN_BITS_INTEGER_MARKER = 125 // as byte: 01111101
const SIXTEEN_BITS_INTEGER_MARKER = 126 // as byte: 01111110
const SIXTYFOUR_BITS_INTEGER_MARKER = 127 // as byte: 01111111
const FIRST_BIT = 128
const MASK_KEY_BYTES_LENGTH = 4
const OPCODE_TEXT = 0x01
const MAXIMUM_SIXTEEN_BITS_INTEGER = 2 ** 16


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

  unmask(encodedBuffer, maskKey) {
    const decoded = Uint8Array.from(encodedBuffer, (element, index) => element ^ maskKey[index % 4])

    return Buffer.from(decoded)
  }

  concat(bufferList, totalLength) {
    const target = Buffer.allocUnsafe(totalLength)
    let offset = 0

    for (const buffer of bufferList) {
      target.set(buffer, offset)
      offset += buffer.length
    }

    return target
  }


  prepareMessage(message) {
    const msg = Buffer.from(message)
    const messageSize = msg.length

    let dataFrameBuffer

    const firstByte = 0x80 | OPCODE_TEXT //bitwise operator
    if (messageSize <= SEVEN_BITS_INTEGER_MARKER) {
      const bytes = [firstByte]
      dataFrameBuffer = Buffer.from(bytes.concat(messageSize))
    } else if (messageSize <= MAXIMUM_SIXTEEN_BITS_INTEGER) {
      const offsetFourBytes = 4
      const target = Buffer.allocUnsafe(offsetFourBytes)
      target[0] = firstByte
      // this is the mask indicator, 0 means unmasked
      target[1] = SIXTEEN_BITS_INTEGER_MARKER | 0x0

      // content length is 2 bytes
      // according to the spreadsheet
      target.writeUint16BE(messageSize, 2)
      dataFrameBuffer = target
    }
    else {
      throw new Error('message too long buddy :(')
    }

    const totalLength = dataFrameBuffer.byteLength + messageSize
    return this.concat([dataFrameBuffer, msg], totalLength)
  }

  sendMessage(msg, socket) {
    const dataFrameBuffer = this.prepareMessage(msg)
    socket.write(dataFrameBuffer)
  }

  onSocketReadable(socket) {
    socket.read(1) // reads and discards the first message byte
    const [markerAndPayloadLength] = socket.read(1) // this gets the integer representation for each bit
    const lengthIndicatorInBits = markerAndPayloadLength - FIRST_BIT

    let messageLength = 0
    if (lengthIndicatorInBits <= SEVEN_BITS_INTEGER_MARKER) {
      messageLength = lengthIndicatorInBits
    } else if (lengthIndicatorInBits === SIXTEEN_BITS_INTEGER_MARKER) {
      // unsigned, big-endian 16-bit integer [0 - 65K] - 2 ** 16
      messageLength = socket.read(2).readUint16BE(0)
    }
    else {
      throw new Error(
        `your message is too long! we don't handle more than 125 characters in the payload`
      )
    }

    const maskKey = socket.read(MASK_KEY_BYTES_LENGTH)
    const encoded = socket.read(messageLength)
    const decoded = this.unmask(encoded, maskKey)
    const received = decoded.toString('utf8')

    const data = JSON.parse(received)
    console.log('message received!', data)

    const msg = JSON.stringify({
      message: data,
      at: new Date().toISOString()
    })
    this.sendMessage(msg, socket)
  }

  onSocketUpgrade(req, socket, head) {
    const { "sec-websocket-key": webClientSocketKey } = req.headers;
    const response = this.prepareHandshakeResponse(webClientSocketKey);
    socket.write(response);
    socket.on("readable", () => this.onSocketReadable(socket))
  }
}

export default WebSocketServer;