const mongoose = require('mongoose');
const connectToDB = require('./database');
connectToDB();

const userSchema = mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: [true, "Account already exists with this email"]
	},
	password: {
		type: String,
		required: true
	}
});

module.exports = mongoose.model('User', userSchema);