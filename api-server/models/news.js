var mongoose = require('mongoose')

var newsSchema = new mongoose.Schema({
    author: String,
    title: String,
    content: String,
    timestamp: Date,
    visible: Boolean
})

module.exports = mongoose.model('news', newsSchema)