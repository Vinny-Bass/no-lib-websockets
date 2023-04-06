import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:1337');

    socket.onopen = () => {
      console.log('WebSocket is connected!');

      const id = Math.round(Math.random() * 100);
      console.log('sending...', id);

      const data = JSON.stringify({
        id,
        name: `[${id}] Vinny Bass`,
        address: {
          street: 'my street',
          number: 20 * id,
        },
        profession: 'developer',
      });

      socket.send(data);
    };

    socket.onmessage = (msg) => {
      const message = msg.data;
      console.log('I got a message!', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    socket.onerror = (error) => console.log('WebSocket error', error);

    socket.onclose = () => console.log('Disconnected from the WebSocket server');

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="App">
      <p>Messages</p>
      <output id="messages">
        {messages.map((message, index) => (
          <React.Fragment key={index}>
            <br />
            {message}
          </React.Fragment>
        ))}
      </output>
    </div>
  );
}

export default App;
