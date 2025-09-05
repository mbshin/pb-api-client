```js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import OrderForm from './components/OrderForm';

function App() {
const [host, setHost] = useState('localhost');
const [port, setPort] = useState('8080');
const [message, setMessage] = useState('');
const [encoding, setEncoding] = useState('utf8');
const [isConnected, setIsConnected] = useState(false);
const [connectionInfo, setConnectionInfo] = useState(null);
const [receivedData, setReceivedData] = useState([]);
const [status, setStatus] = useState('');
const [isLoading, setIsLoading] = useState(false);

const messagesEndRef = useRef(null);

const scrollToBottom = () => {
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [receivedData]);

  useEffect(() => {
    // Set up event listeners
    window.electronAPI.onTCPDataReceived((data) => {
      setReceivedData(prev => [...prev, { ...data, type: 'received' }]);
  });

window.electronAPI.onTCPConnectionClosed((data) => {
setReceivedData(prev => [...prev, { ...data, type: 'system' }]);
setIsConnected(false);
setConnectionInfo(null);
setStatus('Connection closed');
});

// Listen for order byte stream
if (window.electronAPI.onOrderBytes) {
window.electronAPI.onOrderBytes((bytes) => {
setReceivedData(prev => [...prev, {
data: bytes,
timestamp: new Date().toISOString(),
type: 'sent',
message: 'Order Byte Stream'
}]);
});
}

// Check initial connection status
checkConnectionStatus();

return () => {
window.electronAPI.removeAllListeners('tcp-data-received');
window.electronAPI.removeAllListeners('tcp-connection-closed');
};
}, []);

const checkConnectionStatus = async () => {
try {
const status = await window.electronAPI.getConnectionStatus();
setIsConnected(status.connected);
if (status.connected) {
setConnectionInfo({
address: status.remoteAddress,
port: status.remotePort
});
}
  } catch (error) {
console.error('Failed to get connection status:', error);
}
};

const handleConnect = async () => {
if (!host || !port) {
setStatus('Please enter both host and port');
return;
}

setIsLoading(true);
setStatus('Connecting...');

try {
const result = await window.electronAPI.connectTCP(host, parseInt(port));
if (result.success) {
setIsConnected(true);
setStatus(result.message);
setReceivedData(prev => [...prev, {
message: result.message,
timestamp: new Date().toISOString(),
type: 'system'
}]);
await checkConnectionStatus();
} else {
setStatus(result.message);
}
  } catch (error) {
setStatus(error.message);
} finally {
setIsLoading(false);
}
};

const handleDisconnect = async () => {
setIsLoading(true);
try {
const result = await window.electronAPI.disconnectTCP();
setStatus(result.message);
setReceivedData(prev => [...prev, {
message: result.message,
timestamp: new Date().toISOString(),
type: 'system'
}]);
setIsConnected(false);
setConnectionInfo(null);
} catch (error) {
setStatus(error.message);
} finally {
setIsLoading(false);
}
};

const handleSend = async () => {
if (!message.trim()) {
setStatus('Please enter a message to send');
return;
}

if (!isConnected) {
setStatus('Not connected to server');
return;
}

setIsLoading(true);
try {
const result = await window.electronAPI.sendTCPData(message, encoding);
if (result.success) {
setReceivedData(prev => [...prev, {
data: message,
timestamp: new Date().toISOString(),
type: 'sent'
}]);
setMessage('');
setStatus('Message sent successfully');
} else {
setStatus(result.message);
}
  } catch (error) {
setStatus(error.message);
} finally {
setIsLoading(false);
}
};

const clearMessages = () => {
setReceivedData([]);
};

const formatTimestamp = (timestamp) => {
return new Date(timestamp).toLocaleTimeString();
};

return (
<div className="App">
<header className="App-header">
<h1>🔌 TCP Test Client</h1>
<p>Send TCP packets to your server</p>
</header>

<main className="App-main">
{/* Connection Panel */}
<div className="connection-panel">
<h2>Connection Settings</h2>
<div className="connection-form">
<div className="form-group">
<label htmlFor="host">Host:</label>
<input
id="host"
type="text"
value={host}
onChange={(e) => setHost(e.target.value)}
placeholder="localhost"
disabled={isConnected}
/>
</div>

<div className="form-group">
<label htmlFor="port">Port:</label>
<input
id="port"
type="number"
value={port}
onChange={(e) => setPort(e.target.value)}
placeholder="8080"
disabled={isConnected}
/>
</div>

<div className="form-group">
<label htmlFor="encoding">Encoding:</label>
<select
id="encoding"
value={encoding}
onChange={(e) => setEncoding(e.target.value)}
disabled={isConnected}
>
<option value="utf8">UTF-8</option>
<option value="hex">Hex</option>
<option value="base64">Base64</option>
</select>
</div>

<div className="connection-buttons">
{!isConnected ? (
<button
  onClick={handleConnect}
  disabled={isLoading}
  className="btn btn-connect"
>
  {isLoading ? 'Connecting...' : 'Connect'}
</button>
) : (
<button
  onClick={handleDisconnect}
  disabled={isLoading}
  className="btn btn-disconnect"
>
  {isLoading ? 'Disconnecting...' : 'Disconnect'}
</button>
)}
</div>
</div>

{connectionInfo && (
<div className="connection-info">
  <p>✅ Connected to {connectionInfo.address}:{connectionInfo.port}</p>
</div>
)}
</div>

{/* Order Panel */}
<OrderForm />

{/* Message Panel */}
  {isConnected && (
<div className="message-panel">
  <h2>Send Message</h2>
  <div className="message-form">
    <div className="form-group">
      <label htmlFor="message">Message:</label>
      <textarea
        id="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      placeholder="Enter your message here..."
      rows="3"
      onKeyPress={(e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      }
      }}
      />
      </div>
      <button
      onClick={handleSend}
      disabled={isLoading || !message.trim()}
      className="btn btn-send"
      >
      {isLoading ? 'Sending...' : 'Send'}
      </button>
      </div>
      </div>
      )}

      {/* Status and Messages */}
      <div className="status-panel">
      <div className="status-header">
      <h2>Communication Log</h2>
      <button onClick={clearMessages} className="btn btn-clear">
      Clear Log
      </button>
      </div>

      {status && (
      <div className="status-message">
      <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
      {isConnected ? '●' : '○'}
      </span>
      {status}
      </div>
      )}

      <div className="messages-container">
      {receivedData.length === 0 ? (
      <div className="no-messages">
      <p>No messages yet. Connect to a server to start communicating.</p>
      </div>
      ) : (
      receivedData.map((item, index) => (
      <div key={index} className={`message-item ${item.type}`}>
      <div className="message-header">
      <span className="message-type">
      {item.type === 'sent' ? '📤 Sent' :
      item.type === 'received' ? '📥 Received' : '🔔 System'}
      </span>
      <span className="message-time">
      {formatTimestamp(item.timestamp)}
      </span>
      </div>
      <div className="message-content">
      {item.data || item.message}
      </div>
      </div>
      ))
      )}
      <div ref={messagesEndRef} />
      </div>
      </div>
      </main>
      </div>
      );
      }

      export default App;

```
