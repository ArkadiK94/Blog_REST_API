const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl:{
    type: String,
    required: true
  },
  content:{
    type: String,
    required: true
  },
  creator: {
    id: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    name: {
      type: String,
      required: true
    }
  }
},{
  timestamps: true
});

module.exports = mongoose.model("Post", postSchema);