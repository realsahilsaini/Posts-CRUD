const express = require('express');
const connectDB = require('./connectDB');
const userModel = require('./models/user');
const postModel = require('./models/post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
require('dotenv').config();


const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// Session middleware setup
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set 'secure: true' when using HTTPS
}));

// Flash message middleware setup
app.use(flash());

// Middleware to make flash messages available in all views
app.use((req, res, next) => {
  res.locals.flashMessages = req.flash();
  next();
});

connectDB();


app.get('/', (req, res) => {
  res.render("index");
});

app.get('/login', (req, res) => {
  res.render("login");
});


app.post('/register', async (req, res) => {
  let { email, password, username, name, age } = req.body;

  // Check if user already exists
  const userAlreadyExists = await userModel.findOne({ email: email });


  if (userAlreadyExists) {
    req.flash('error', 'User already exists. Please login.');
    return res.redirect('/login');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user
  const user = new userModel({
    email,
    password: hashedPassword,
    username,
    name,
    age
  });

  // Save the user to the database
  await user.save();

  // Create JWT token
  let token = jwt.sign({ email: email, userid: user._id }, process.env.JWT_SECRET);

  // Set token in cookies
  res.cookie('token', token);

  // Set flash message for successful registration
  req.flash('success', 'User registered successfully. Please log in.');

  // Redirect to the login page
  res.redirect('/login');
});


app.post('/login', async (req, res) => {
  let { email, password } = req.body;

  // Check if user exists
  const user = await userModel.findOne({ email: email });

  if (!user) {
    req.flash('error', 'Invalid credentials. Please try again.');
    return res.redirect('/login');
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    req.flash('error', 'Invalid credentials. Please try again.');
    return res.redirect('/login');
  }

  return res.send('Logged in successfully');

});


app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});