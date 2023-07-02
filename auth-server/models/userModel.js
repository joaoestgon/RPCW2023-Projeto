var mongoose = require('mongoose');

var passportLocalMongoose = require('passport-local-mongoose')

// NOTA: a p*** da password não pode ser required

var userSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: function() {
          return this.username; // Set _id field as the value of the username field
        },
    },
    name: String,
    affiliation: String,
    username: {
            type: String,
            required: true,
            unique: true },
    password: { 
            type: String, 
            required: true },
    email: { 
        type: String, 
        unique: true },
    level: { 
        type: String, 
        required: true },
    dateCreated: {
        type: String,
        required: true}
});

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('user', userSchema)