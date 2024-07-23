require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const projectId = 'chatbot-emkl'; // Replace with your project ID
const sessionClient = new dialogflow.SessionsClient();
const sessionId = uuid.v4();

app.use(express.static(__dirname + '/views')); // Serve HTML
app.use(express.static(__dirname + '/public')); // Serve JS, CSS, images

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('chat message', async (text) => {
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: text,
          languageCode: 'en-US',
        },
      },
    };

    try {
      const responses = await sessionClient.detectIntent(request);
      const result = responses[0].queryResult;
      const aiText = result.fulfillmentText;
      socket.emit('bot reply', aiText);
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
