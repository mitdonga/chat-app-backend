const mongoose = require('mongoose');

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_ATLAS, {
    // await mongoose.connect('mongodb://127.0.0.1:27017/chatappDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
};

module.exports = connectToDB;