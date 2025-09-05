const net = require('net');

const PORT = 8080;
const HOST = '127.0.0.1';

// Create TCP server
const server = net.createServer((socket) => {
  console.log(`Client connected from ${socket.remoteAddress}:${socket.remotePort}`);

  // Send welcome message
  socket.write('Welcome to TCP Test Server!\n');

  // Handle incoming data
  socket.on('data', (data) => {
    const message = data.toString().trim();
    console.log(`Received: ${message}`);

    // Echo the message back with timestamp
    const response = `Echo: ${message} (${new Date().toISOString()})\n`;
    socket.write(response);

    // Send some additional test data
    setTimeout(() => {
      socket.write(`Server time: ${new Date().toISOString()}\n`);
    }, 1000);
  });

  // Handle client disconnect
  socket.on('close', () => {
    console.log(`Client disconnected: ${socket.remoteAddress}:${socket.remotePort}`);
  });

  // Handle errors
  socket.on('error', (err) => {
    console.error(`Socket error: ${err.message}`);
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`TCP Test Server running on ${HOST}:${PORT}`);
  console.log('Use this server to test your TCP client application');
  console.log('Press Ctrl+C to stop the server');
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please choose a different port.`);
  } else {
    console.error(`Server error: ${err.message}`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
