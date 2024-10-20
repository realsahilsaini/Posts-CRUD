const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId,ref: "user"}, 
  content: {type: String,required: true},
  likes: [{type: mongoose.Schema.Types.ObjectId, ref: "user"}]
}, {timestamps: true});


const userModel = mongoose.model("post", postSchema);


module.exports = userModel;