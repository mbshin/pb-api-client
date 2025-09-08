#!/usr/bin/env node
// TCP Echo Mock Server (single connection only)
// Modes:
//   RAW mode (default) - echoes back received bytes
//   FRAMED mode (set env FRAMED=1) - 4-byte big-endian length-prefixed messages
//
// Usage:
//   node echo_server.js --port 9000
//   FRAMED=1 node echo_server.js --port 9000

const net = require('net');
const { argv, env } = require('process');

const arg = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : def;
};

const PORT = parseInt(arg('port', '9000'), 10);
const HOST = arg('host', '0.0.0.0');
const IDLE_MS = parseInt(arg('idle', '0'), 10); // 0 = no idle timeout
const FRAMED = !!env.FRAMED;

function now() {
  return new Date().toISOString();
}

function hexdump(buf, max = 256) {
  const slice = buf.length > max ? buf.subarray(0, max) : buf;
  return slice.toString('hex').replace(/(..)/g, '$1 ').trim() + (buf.length > max ? ' …' : '');
}

let activeSocket = null; // track single active client

const server = net.createServer((socket) => {
  const r = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`[${now()}] + CONNECT ${r}`);

  // Drop previous connection if still alive
  if (activeSocket) {
    console.log(`[${now()}] ! Dropping previous connection`);
    activeSocket.destroy();
  }
  activeSocket = socket;

  if (IDLE_MS > 0) socket.setTimeout(IDLE_MS, () => {
    console.log(`[${now()}] ! IDLE ${r} -> closing`);
    socket.end();
  });

  if (!FRAMED) {
    // RAW MODE
    socket.on('data', (chunk) => {
      console.log(`[${now()}] < ${r} (${chunk.length}B) ${hexdump(chunk)}`);
      socket.write(chunk); // echo back raw
    });
  } else {
    // FRAMED MODE (4-byte BE length prefix)
    let buf = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      while (buf.length >= 4) {
        const len = buf.readUInt32BE(0);
        if (buf.length < 4 + len) break;
        const body = buf.subarray(4, 4 + len);
        console.log(`[${now()}] < ${r} frame len=${len} ${hexdump(body)}`);
        const out = Buffer.allocUnsafe(4 + len);
        out.writeUInt32BE(len, 0);
        body.copy(out, 4);
        socket.write(out);
        buf = buf.subarray(4 + len);
      }
    });
  }

  socket.on('close', () => {
    console.log(`[${now()}] - CLOSE ${r}`);
    if (activeSocket === socket) activeSocket = null;
  });

  socket.on('error', (err) => {
    console.log(`[${now()}] ! ERROR ${r}: ${err.message}`);
  });
});

server.on('error', (err) => {
  console.error(`[${now()}] ! SERVER ERROR: ${err.message}`);
});

server.listen(PORT, HOST, () => {
  console.log(`[${now()}] TCP Echo Mock Server listening on ${HOST}:${PORT} (FRAMED=${FRAMED ? 'yes' : 'no'})`);
  if (IDLE_MS > 0) console.log(`[${now()}] Idle timeout: ${IDLE_MS}ms`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`[${now()}] ^C received, closing server...`);
  server.close(() => {
    console.log(`[${now()}] Server closed.`);
    process.exit(0);
  });
});
