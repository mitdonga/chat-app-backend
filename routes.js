const router = require('express').Router();

const ChatRoomController = require('./controllers/ChatController');
const LoginController = require('./controllers/LoginController');

const AuthUser = require('./auth/AuthUser');

router.get('/', (req, res) => {
	res.render('home')
})

router.use("/chat-rooms", AuthUser)

router.get('/chat-rooms', ChatRoomController.index);

router.get('/chat-rooms/:name', ChatRoomController.show);

router.post('/signup', LoginController.signup);

router.post('/login', LoginController.login)

module.exports = router