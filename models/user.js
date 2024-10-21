const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://admin:admin12345@cluster0.v9pun.mongodb.net/crud_post?retryWrites=true&w=majority&appName=Cluster0"
);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  age: {
    type: Number,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
    default: "default_dp.jpg",
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
});


const userModel = mongoose.model("user", userSchema);


module.exports = userModel;