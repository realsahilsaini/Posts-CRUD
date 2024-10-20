const express = require('express');
const app = express();
const connectDB = require('./connectDB');
const userModel = require('./models/user');
const postModel = require('./models/post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();


app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDB();


app.get('/', (req, res) => {
  res.render("index");
});


app.post('/register', async (req, res) => {
  let {email, password, username, name, age} = req.body;

  const userAlreadyExists = await userModel.findOne({ email: email });

  if (userAlreadyExists) {
    return res.status(400).send('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new userModel({
    email,
    password: hashedPassword,
    username,
    name,
    age
  });


  await user.save();

  let token = jwt.sign({email: email, userid: user._id}, process.env.JWT_SECRET);

  res.cookie('token', token);
  res.send({message: 'User registered successfully', token: token});

});


app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});