var mongoose = require('mongoose')

var commentSchema = new mongoose.Schema({
    idUser: String,
    idResource: String,
    date: Date,
    text: String
})

module.exports = mongoose.model('comment', commentSchema)