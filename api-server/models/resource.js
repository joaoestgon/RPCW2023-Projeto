var mongoose = require('mongoose')

var resourceSchema = new mongoose.Schema({
    submissionDate: Date,
    dateCreated: String,
    idProducer: String, 
    authors: [String], 
    title: String,
    description: String,
    type: String,
    path: String,
    reviews : [{
        _id: false,
        idUser : String,
        value : Number
    }]
})

module.exports = mongoose.model('resource', resourceSchema)