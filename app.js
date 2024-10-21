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
const upload = require('./utils/multerconfig');


const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
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

   // Create JWT token
   let token = jwt.sign({ email: email, userid: user._id }, process.env.JWT_SECRET);

   // Set token in cookies
   res.cookie('token', token);

  return res.redirect('/profile');

});


app.get('/logout', (req, res) => {

    res.clearCookie('token');
    req.flash('success', 'Logged out successfully');
    return res.redirect('/login');

});


app.get('/profile', isLoggedIn, async (req, res) => {

  let user = await userModel.findOne({email: req.user.email}).populate('posts');

  res.render('Profile', {user: user});
});

app.get('/profile/upload', isLoggedIn, (req, res) => {
  res.render('profileupload');
});

app.post('/upload', isLoggedIn, upload.single('profile'), async (req, res) => {
  
  await userModel.findOneAndUpdate({email: req.user.email}, {
    profilePic: req.file.filename
  })

  res.redirect('/profile');
});

app.get('/like/:postid', isLoggedIn, async (req, res) => {

  let post = await postModel.findOne({_id: req.params.postid}).populate('user');

  //Check if the user has already liked the post
  if(post.likes.indexOf(req.user.userid) === -1) {
    //We are getting user from the request object from the isLoggedIn middleware
    post.likes.push(req.user.userid);
  }else{
    //This will remove the like from the post if the user has already liked it by filtering out the user id if it is already present in the likes array of the post model object.
    //This is done to prevent the user from liking the post multiple times. 
    // post.likes = post.likes.filter((like) => like != req.user.userid);

    //We can also use splice method to remove the like from the post model object
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }


  await post.save();

  //Redirecting to the profile page rather than re-renderng as we are already sending the user object through the profile page in the get request of the profile route. 
  res.redirect('/profile');
});


app.get('/edit/:postid', isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({_id: req.params.postid});

  res.render('edit', {post: post});
});

app.post('/update/:postid', isLoggedIn, async (req, res) => {

  let newContent = req.body.content;

  await postModel.findOneAndUpdate(
    {
      _id: req.params.postid
    },{
      content: newContent
    });

  req.flash('success', 'Post updated successfully');  
  res.redirect('/profile');

});

app.post('/post', isLoggedIn, async (req, res)=>{


  let user = await userModel.findOne({email: req.user.email});

  let post = await new postModel({
    user: user._id,
    content: req.body.content
  });

  //Here we need to save as we are creating a new post
  await post.save();

  user.posts.push(post._id);

  //Here we need to save as we are updating the user's posts array
  await user.save();

  req.flash('success', 'Post created successfully');

  res.redirect('/profile');

})



function isLoggedIn(req, res, next) {
  if (!req.cookies.token) {
    req.flash('error', 'You need to be logged in to access this route.');
    return res.redirect('/login');
  }

    // Verify the token
    const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);

    // Set the user in the request object
    req.user = decoded;

    next();

}


app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});