// models/Search.js
const mongoose = require('mongoose');

const SearchSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: String },
  url: { type: String, required: true },
  image: { type: String },
  location: { type: String },
  state: { type: String },
  source: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Search', SearchSchema);
