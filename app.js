require('dotenv').config()
const User = require('./models/user');
const Message = require('./models/message');
const ChatRoom = require('./models/chatRoom');
const Routes = require('./routes')

const express = require('express')
const cors = require('cors')
const app = express()
const http = require('http');
const server = http.createServer(app);
const socketio = require("socket.io");
const cookieParser = require('cookie-parser')
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 3000

app.use(express.json());
const corsConfig = {
	origin: process.env.FRONTEND_URL,
	credentials: true
}
app.use(cors(corsConfig))
app.use(cookieParser())
app.options('*', cors(corsConfig))
app.set("view engine", "ejs");

const subscribedUsers = new Map();
const typingUsers = new Map();

app.use(Routes)

io.on('connection', (socket) => {
	console.log("Connected :", socket.id);

	socket.on("message", async (msg) => {
		if (msg && msg.content && msg.chatroom && msg.sender){
			const message = new Message(msg)
			await message.save();
			await message.populate({path: 'sender', select: 'name email'});
			io.to(msg.chatroom).emit("message", message);
		}
	});

	socket.on('join', async ({roomId, userId}) => {
		socket.join(roomId);
		const user = await User.findById(userId);
		subscribedUsers.set(socket.id, user);
	});

	socket.on('startTyping', ({roomId}) => {
		if (typingUsers.get(roomId)){
			typingUsers.get(roomId).push(socket.id)
		} else {
			typingUsers.set(roomId, [socket.id])
		}
		emitTypingUsers(roomId);
	})

	socket.on('stopTyping', ({roomId}) => {
		const users = typingUsers.get(roomId)
		if (users?.length > 0){
			const remainingUsers = users.filter(s => s && s !== socket.id)
			typingUsers.set(roomId, remainingUsers)
		}
		emitTypingUsers(roomId);
	})

  socket.on('disconnect', () => {
		console.log("Disconnected ", socket.id);
		subscribedUsers.delete(socket.id)
  });

	function emitTypingUsers(roomId) {
		const typingSockets = typingUsers.get(roomId);
		if (typingSockets?.length >= 0){
			const users = [];
			typingSockets.forEach(s => {
				if (subscribedUsers.get(s)) users.push(subscribedUsers.get(s).name)
			})
			io.to(roomId).emit('typing', {typingUsers: users});
		}
	}
});

server.listen(port, () => {
  console.log(`App listening on port http://localhost:${port}`)
})