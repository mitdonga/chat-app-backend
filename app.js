//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var _ = require('lodash');
const { Post, Comment } = require('./models/blog');

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";

const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";

const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

const posts = [];

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get('/about', (req, res) => {
 res.render(__dirname + "/views/about", {content: aboutContent});
});

app.get('/contact', (req, res) => {
	res.render(__dirname + "/views/contact", {content: contactContent});
});

app.get('/compose', (req,res) => {
	res.render(__dirname + "/views/compose");
});

// Read all posts
app.get('/', (req, res) => {
	async function fetchPosts(){
		try {
			var posts = await Post.find({});
			res.render(__dirname + "/views/home", {content: homeStartingContent, posts: posts});
		} catch (err) {
			console.log(err);
		}
	}
	fetchPosts();
});

// Create a new post
app.post('/compose', (req,res) => {
	var newPost = {
		title: req.body.title,
		body: req.body.body,
		slug: req.body.slug
	}

	async function createPost(newPost){
		try {
			const post = await new Post(newPost);
			await post.save();
			res.redirect("/");
		} catch (err) {
			console.log(err);
			next(err);
		}
	}

	createPost(newPost);

});

// Update post
app.post('/posts/:postSlug', (req, res) => {
	const slug = req.params.postSlug;
	const newPost = {
		title: req.body.title,
		body: req.body.body,
		slug: req.body.slug
	}

	async function updatePost(newPost){
		try {
			await Post.updateOne({ slug: slug}, newPost)
			console.log(newPost);
			res.redirect("/");
		} catch (err) {
			console.log(err);
			next(err);
		}
	}

	updatePost(newPost);
});

// Read single post
app.get('/posts/:postSlug', (req, res) => {
	let postSlug = req.params.postSlug;
	async function findPost(){
		try {
			let post = await Post.findOne({ slug: postSlug})
			if (!post) res.render(__dirname + '/views/404')
			res.render(__dirname + "/views/post", {post: post});
		} catch (err) {
			console.log(err);
		}
	}
	findPost();
});

// Post not found 404
app.get('/posts/:postSlug/edit', (req, res) => {
	let postSlug = req.params.postSlug;
	async function findPost(){
		try {
			let post = await Post.findOne({ slug: postSlug})
			if (!post) res.render(__dirname + '/views/404')
			res.render(__dirname + "/views/edit", {post: post});
		} catch (err) {
			console.log(err);
		}
	}
	findPost();
});

// Delete Post
app.post('/posts/:postSlug/delete', (req, res) => {
	let postSlug = req.params.postSlug;
	async function deletePost(){
		try {
			await Post.deleteOne({ slug: postSlug });
			res.redirect("/");
		} catch (err) {
			console.log(err);
		}
	}
	deletePost();
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
