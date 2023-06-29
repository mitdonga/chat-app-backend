const User = require('../models/user')
const jwt = require("jsonwebtoken")
const jwtKey = process.env.JWT_SECRET


const authUser = (req, res, next) => {
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

module.exports = authUser;