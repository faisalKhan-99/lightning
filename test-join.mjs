import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected. Sending join...');
  ws.send(JSON.stringify({
    type: 'join',
    phantomWallet: 'TestWa11et1111111111111111111111111111111111',
    role: 'solar',
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'join_ack') {
    console.log('JOIN_ACK:', JSON.stringify(msg, null, 2));
    ws.close();
    process.exit(0);
  }
  // Ignore state broadcasts
});

ws.on('error', (err) => {
  console.error('WS error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('Timeout waiting for join_ack');
  process.exit(1);
}, 30000);
