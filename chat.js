const express = require('express')
const cors = require('cors')
const app = express()
const { User, Message, ChatRoom } = require('./models/chat');
const http = require('http');
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const port = 3000

const bodyParser = require("body-parser");
const ejs = require("ejs");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(cors())

// app.get("/", (req, res) => {
// 	res.redirect("/1");
// })

// app.get('/:roomId', async (req, res) => {
// 	const roomId = req.params.roomId;
// 	const chatRoom = roomId > 0 ? await ChatRoom.findOne({ roomId: Number(roomId) }) : null;
// 	if (chatRoom) {
// 		try {
// 			res.render(__dirname + "/views/chatRoom", {chat: chatRoom})
// 		} catch(err) {
// 			console.log(err);
// 			res.render(__dirname + "/views/chatRoom", {chat: chatRoom, error: err})
// 		}
// 	}
// 	else {
// 		res.render(__dirname + "/views/404");
// 	}
// })

app.post('/save', async (req, res) => {
	const roomId = Number(req.body.roomId);
	const message = req.body.message;
	const username = req.body.username;

	const chatRoom = roomId > 0 ? await ChatRoom.findOne({ roomId: roomId }) : null;
	if (chatRoom) {
		try {
			const chatMessage = { content: message, messenger: { username: username }}
			chatRoom.messages.push(chatMessage);
			await chatRoom.save()
			io.emit('new message', { chatMessage: chatMessage, chatRoom: chatRoom});
			res.redirect(`/${roomId}`)
		} catch(err) {
			console.log(err);
			res.render(__dirname + "/views/chatRoom", {chat: chatRoom, error: err})
		}
	}
	else {
		res.render(__dirname + "/views/404");
	}
});

app.get('/chat-rooms', async (req, res) => {
	const chatRooms = await ChatRoom.find({});
	if (chatRooms.length > 0) {
		res.json(chatRooms)
	} else {
		res.json({ message: 'No chat room found'});
	}
});

io.on('connection', (socket) => {
  console.log('A user connected');

	socket.on("message", async (msg) => {
		console.log(msg);
		if (msg && msg.username && msg.content && msg.roomId && msg.roomName){
			const chatRoom = await ChatRoom.findOne({roomId: msg.roomId});
			const chatMessage = { content: msg.content, messenger: { username: msg.username }}
			chatRoom.messages.push(chatMessage);
			await chatRoom.save();
			io.to(msg.roomName).emit("message", chatMessage);
		}
	});

	socket.on('join', (chatRoom) => {
		socket.join(chatRoom);
		console.log('Client joined chat room: ', chatRoom);
	});

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(port, () => {
  console.log(`App listening on port http://localhost:${port}`)
})