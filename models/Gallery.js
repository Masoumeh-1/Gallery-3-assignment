const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    FILENAME: String,
    DESCRIPTION: String,
    PRICE: Number,
    STATUS: String
}, { collection: 'Gallery' });

module.exports = mongoose.model('Gallery', gallerySchema);
