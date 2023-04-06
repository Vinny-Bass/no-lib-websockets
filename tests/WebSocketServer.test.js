import WebSocketServer from '../src/WebSocketServer';
import crypto from 'node:crypto';

const WEBSOCKET_MAGIC_STRING_KEY = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

describe('WebSocketServer', () => {
  let webSocketServer;

  beforeEach(() => {
    webSocketServer = new WebSocketServer();
  });

  test('createSocketAccept generates a valid accept key', () => {
    const testKey = 'testKey123';
    const expectedKey = crypto.createHash('sha1').update(testKey + WEBSOCKET_MAGIC_STRING_KEY).digest('base64');
    const actualKey = webSocketServer.createSocketAccept(testKey);
    expect(actualKey).toEqual(expectedKey);
  });

  test('prepareHandshakeResponse creates a valid response string', () => {
    const testKey = 'testKey123';
    const acceptKey = webSocketServer.createSocketAccept(testKey);
    const expectedResponse = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      ''
    ].map(line => line.concat('\r\n')).join('');

    const actualResponse = webSocketServer.prepareHandshakeResponse(testKey);
    expect(actualResponse).toEqual(expectedResponse);
  });
});
