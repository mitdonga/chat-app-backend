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

const port = process.env.PORT || 3000
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

app.get('/', (req, res) => {
	res.send({ message: "Welcome to Mit's Chat App.." })
})

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
		res.status(200).json({ message: `Found ${chatRooms.length} chat rooms`, chatRooms: chatRooms })
	} else {
		res.status(204).json({ message: 'No chat room found'});
	}
});

app.get('/chat-rooms/:name', authUserMW, async (req, res) => {
	try {
		const roomName = req.params.name
		const chatRoom = await ChatRoom.findOne({name: roomName});
		const message = new Message({content: `Welcome to ${roomName} Chat..`, sender: req.user._id, chatroom: chatRoom._id});
		if (chatRoom) {
			const messages = await Message.find({chatroom: chatRoom._id}).populate({path: 'sender', select: 'name email'});
			if (messages.length === 0) await message.save()
			res.status(200).json({ chatRoom: chatRoom, messages: messages})
		} else {
			res.status(204).json({ message: 'No chat room found'});
		}
	} catch (err) {
		res.status(400).json({ message: "Opps! something went wrong" })
	}
});

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