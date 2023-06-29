const User = require("../models/user")
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')

const jwtKey = process.env.JWT_SECRET

const signup = async (req, res) => {
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
					res.status(200).json({ message: "Signup successful", user: user })
				});
			});
		} catch (err) {
			res.status(400).json({
				message: "Oops! Something went wrong",
				error: err.message
			});
		}
	}
}

const login = async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email: email }).lean()
	if (user){
		bcrypt.compare(password, user.password).then(function (result) {
			if (result){
				const maxAge = 24*60*60
				const token = getToken({ email: email, id: user._id }, maxAge)
				res.cookie('token', token, {
					sameSite: "none",
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
}

module.exports = { login, signup }

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