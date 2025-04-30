const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 });

console.log(' WebSocket Server is running on ws://localhost:8081');

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    console.log(' Message received from one client. Broadcasting...');
    
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log(' Client disconnected');
  });
});
