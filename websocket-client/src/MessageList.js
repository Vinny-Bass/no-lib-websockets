import React, { useState, useRef, useEffect } from 'react';
import './MessageList.css';

const MessageList = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const sendMessage = () => {
    if (message.trim() === '' || !socket) return;
    socket.send(JSON.stringify(message));
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const ws = new WebSocket('ws://localhost:1337');
    setSocket(ws);

    ws.onopen = () => {
      console.log('WebSocket is connected!');
    };

    ws.onmessage = (msg) => {
      const message = msg.data;
      console.log('I got a message!', message);
      setMessages((prevMessages) => [...prevMessages, { id: Date.now(), text: message }]);
    };

    ws.onerror = (error) => console.log('WebSocket error', error);
    ws.onclose = () => console.log('Disconnected from the WebSocket server');

    return () => {
      if (ws.readyState === 1) {
        ws.close();
      }
    };
  }, []);

  return (
    <div className="message-container">
      <div className="message-list">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      <div className="message-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default MessageList;
