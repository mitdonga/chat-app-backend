require('dotenv').config()
const User = require('./models/user');
const Message = require('./models/message');
const ChatRoom = require('./models/chatRoom');

const express = require('express')
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const cors = require('cors')
const app = express()
const http = require('http');
const server = http.createServer(app);
const socketio = require("socket.io");
const cookieParser = require('cookie-parser')
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const port = 3000
const jwtKey = process.env.JWT_SECRET

app.use(express.json());
const corsConfig = {
	origin: true,
	credentials: true
}
app.use(cors(corsConfig))
app.use(cookieParser())
app.options('*', cors(corsConfig))

const subscribedUsers = new Map();
const typingUsers = new Map();

const authUserMW = (req, res, next) => {
	const token = req.cookies.token
	if (!token) {
		res.status(401).json({ message: "You're not authorized to access, please login again." })
	} else {
		jwt.verify(token, jwtKey, async (err, decodedToken) => {
			if (err) {
				res.status(401).json({ message: "Session expired, please login" })
			} else if (decodedToken && decodedToken.id) {
				const user = await User.findById(decodedToken.id)
				req.user = user;
				next();
			} else {
				res.clearCookie('token')
				res.status(401).json({ message: "Session expired, please login" })
			}
		})
	}
}

app.post('/signup', async (req, res) => {
	const { email, password, confirm_password, name } = req.body;
	let user = await User.findOne({ email: email });
	if (user){
		res.status(422).json({ message: "Account already registered, please login"});
	} else {
		try {
			bcrypt.genSalt(3, function(err, salt) {
				bcrypt.hash(password, salt, async function(err, hash) {
					user = new User({ email: email, name: name, password: hash })
					await user.save()
					res.status(200).json({ message: "Singup successful", user: user })
				});
			});
		} catch (err) {
			res.status(400).json({
				message: "Opps! Something went wrong",
				error: err.message
			});
		}
	}
})

app.post('/login', async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email: email }).lean()
	if (user){
		bcrypt.compare(password, user.password).then(function (result) {
			if (result){
				const maxAge = 24*60*60
				const token = getToken({ email: email, id: user._id }, maxAge)
				res.cookie('token', token, {
					httpOnly: true,
					maxAge: maxAge * 1000,
					secure: true
				})
				delete user.password
				delete user.__v
				delete user._id
				console.log(user);
				res.status(200).json({ message: "Login successful", user })
			} else {
				res.status(400).json({ message: "Enter correct password" })
			}
		})
	} else {
		res.status(404).json({message: "User not found, please signup"})
	}
})

app.get('/chat-rooms', authUserMW, async (req, res) => {
	const chatRooms = await ChatRoom.find({});
	if (chatRooms.length > 0) {
		res.status(200).json(chatRooms)
	} else {
		res.status(204).json({ message: 'No chat room found'});
	}
});

io.on('connection', (socket) => {

	socket.on("message", async (msg) => {
		if (msg && msg.username && msg.content && msg.roomId && msg.roomName){
			const chatRoom = await ChatRoom.findOne({roomId: msg.roomId});
			const chatMessage = { content: msg.content, messenger: { username: msg.username }}
			chatRoom.messages.push(chatMessage);
			await chatRoom.save();
			io.to(msg.roomName).emit("message", chatMessage);
		}
	});

	socket.on('join', ({roomName, user}) => {
		socket.join(roomName);
		subscribedUsers.set(socket.id, user);
		// const clientsInChannel = io.sockets.adapter.rooms.get(roomName);
	});

	socket.on('startTyping', ({roomName}) => {
		if (typingUsers.get(roomName)){
			typingUsers.get(roomName).push(socket.id)
		} else {
			typingUsers.set(roomName, [socket.id])
		}
		emitTypingUsers(roomName);
	})

	socket.on('stopTyping', ({roomName}) => {
		const users = typingUsers.get(roomName)
		if (users?.length > 0){
			const remainingUsers = users.filter(s => s && s !== socket.id)
			typingUsers.set(roomName, remainingUsers)
		}
		emitTypingUsers(roomName);
	})

  socket.on('disconnect', () => {
    console.log('Disconnected user: ', subscribedUsers.get(socket.id));
		subscribedUsers.delete(socket.id)
  });

	function emitTypingUsers(roomName) {
		const typingSockets = typingUsers.get(roomName);
		if (typingSockets?.length >= 0){
			const users = [];
			typingSockets.forEach(s => {
				if (subscribedUsers.get(s)) users.push(subscribedUsers.get(s))
			})
			io.to(roomName).emit('typing', {typingUsers: users});
		}
	}
});

server.listen(port, () => {
  console.log(`App listening on port http://localhost:${port}`)
})

function getToken(data, maxAge=24*60*60){
	const token = jwt.sign(
		data,
		jwtKey,
		{
			expiresIn: maxAge,
		}
	);
	return token
}