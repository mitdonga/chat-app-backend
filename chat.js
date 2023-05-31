const express = require('express')
const { User, Message, ChatRoom } = require('./models/chat');

const app = express()
const port = 3000

const bodyParser = require("body-parser");
const ejs = require("ejs");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", (req, res) => {
	res.redirect("/1");
})

app.get('/:roomId', async (req, res) => {
	const roomId = req.params.roomId;
	const chatRoom = roomId > 0 ? await ChatRoom.findOne({ roomId: Number(roomId) }) : null;
	if (chatRoom) {
		try {
			res.render(__dirname + "/views/chatRoom", {chat: chatRoom})
		} catch(err) {
			console.log(err);
			res.render(__dirname + "/views/chatRoom", {chat: chatRoom, error: err})
		}
	}
	else {
		res.render(__dirname + "/views/404");
	}
})

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

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})