const mongoose = require('mongoose');

// mongoose.connect('mongodb+srv://mitpatel5344:5344@indiancluster.qcyvhu0.mongodb.net/chatDB?retryWrites=true&w=majority', { useNewUrlParser: true });
mongoose.connect('mongodb://127.0.0.1:27017/chatDB');

const userSchema = mongoose.Schema({
	username: {
		type: String,
		required: true
	}
});

// { username: "mit_donga" }

const messageSchema = mongoose.Schema({
	content: {
		type: String,
		required: true
	},
	messenger: userSchema
});

// {
// 	content: "Hello Node & Mongoo",
// 	messenger: { username: "mit_donga" }
// }

const chatRoomSchema = mongoose.Schema({
	roomId: {
		type: Number,
		required: true
	},
	roomName: {
		type: String,
		required: true
	},
	messages: [messageSchema]
});

// {roomId: 1, roomName: "Public", messages: [{ content: "Hello Node & Mongoo", messenger: { username: "mit_donga" }}]}

const ChatRoom = mongoose.model('Chat', chatRoomSchema);
const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { User, ChatRoom, Message };