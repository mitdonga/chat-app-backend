const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/peopleDB', { useNewUrlParser: true });

const personSchema = mongoose.Schema({
	name: String,
	age: Number
});

const Person = mongoose.model('Person', personSchema);

// const person = new Person ({
// 	name: 'Mit Donga',
// 	age: 25
// });

// Person.insertMany([
// 	{
// 		name: "Rahul Radadiya",
// 		age: 30
// 	},
// 	{
// 		name: "Shubham Chandroliya",
// 		age: 24
// 	},
// 	{
// 		name: "Sarthak Ghoniya",
// 		age: 25
// 	},
// 	{
// 		name: "Vinit Faldu Ji",
// 		age: 26
// 	},
// 	{
// 		name: "Krunal Donga",
// 		age: 27
// 	}
// ])

// const people = Person.find().exec(callback)

async function getPeople(){
	const people = await Person.find({});;
	console.log(people);
}

getPeople();

async function deletePeople(){
	try {
		const people = await Person.findOneAndUpdate({name: /Mit/}, {_id: 1, age: 100});
		console.log(people);
	} catch (err) {
		console.log(err.message);
	}
}

deletePeople();




