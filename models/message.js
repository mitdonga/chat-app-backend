const mongoose = require('mongoose');
const connectToDB = require('./database');
connectToDB();

const messageSchema = mongoose.Schema({
	content: {
		type: String,
		required: true
	},
	sender: { 
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'User', 
		required: true
	},
	chatroom: { 
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'ChatRoom', required: 
		true
	},
	timestamp: { 
		type: Date, 
		default: Date.now() 
	}
});

module.exports = mongoose.model('Message', messageSchema)