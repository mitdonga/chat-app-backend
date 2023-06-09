const mongoose = require('mongoose');
const connectToDB = require('./database');
connectToDB();

const chatRoomSchema = mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	participants: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	}]
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);