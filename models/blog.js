const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://mitpatel5344:5344@indiancluster.qcyvhu0.mongodb.net/blogDB?retryWrites=true&w=majority', { useNewUrlParser: true });
// mongoose.connect('mongodb://localhost:27017/blogDB', { useNewUrlParser: true });

const commentSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	body: {
		type: String,
		required: true
	}
});

const postSchema = mongoose.Schema({
	title: {
		type: String,
		required: true,
		min: [10, 'Title is too short, it must be at least 10 characters long'],
    max: [60, 'Title is too long, it should be less than 60 characters long']
	},
	slug: {
		type: String,
		required: true,
    max: [20, 'Slug is too long, it should be less than 20 characters long']
	},
	body: {
		type: String,
		required: true,
		min: [100, 'Post conent is too short, it must be at least 100 characters long']
	},
	comments: [commentSchema]
});

const Post = mongoose.model('Post', postSchema);
// module.exports = Post;

const Comment = mongoose.model('Comment', commentSchema);
module.exports = {Post, Comment};

// const personSchema = mongoose.Schema({
// 	name: String,
// 	age: Number
// });

// const Person = mongoose.model('Person', personSchema);

// // const person = new Person ({
// // 	name: 'Mit Donga',
// // 	age: 25
// // });

// // Person.insertMany([
// // 	{
// // 		name: "Rahul Radadiya",
// // 		age: 30
// // 	},
// // 	{
// // 		name: "Shubham Chandroliya",
// // 		age: 24
// // 	},
// // 	{
// // 		name: "Sarthak Ghoniya",
// // 		age: 25
// // 	},
// // 	{
// // 		name: "Vinit Faldu Ji",
// // 		age: 26
// // 	},
// // 	{
// // 		name: "Krunal Donga",
// // 		age: 27
// // 	}
// // ])

// // const people = Person.find().exec(callback)

// async function getPeople(){
// 	const people = await Person.find({});;
// 	console.log(people);
// }

// getPeople();

// async function deletePeople(){
// 	try {
// 		const people = await Person.findOneAndUpdate({name: /Mit/}, {_id: 1, age: 100});
// 		console.log(people);
// 	} catch (err) {
// 		console.log(err.message);
// 	}
// }

// deletePeople();




