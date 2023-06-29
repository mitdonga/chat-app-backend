const ChatRoom = require("../models/chatRoom")
const Message = require("../models/message")


async function index(req, res){
	const chatRooms = await ChatRoom.find({});
	if (chatRooms.length > 0) {
		res.status(200).json({ message: `Found ${chatRooms.length} chat rooms`, chatRooms: chatRooms })
	} else {
		res.status(204).json({ message: 'No chat room found'});
	}
};

async function show(req, res){
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
		res.status(400).json({ message: "Oops! something went wrong" })
	}
};

module.exports = { index, show }