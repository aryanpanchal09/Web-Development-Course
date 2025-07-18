const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    uuid: {
      type: String,
      default: uuidv4,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    creator: {
      type: Object,
      required: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
