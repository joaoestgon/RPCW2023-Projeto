var mongoose = require('mongoose')
var commentModel = require('../models/comment')

/*
// Inserir comentário
module.exports.insert = value =>{
    var newComment = new commentModel(value)
    newComment._id = new mongoose.Types.ObjectId()
    newComment.date = new Date().toISOString().substring(0,16).split('T').join(' '); // ???
    return newComment.save()
}
*/

/* NEW Comment */
module.exports.insert = c => {
    return commentModel.create(c)
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

/* LIST Comment by Id */
module.exports.getById = id => {
    return commentModel.findOne({_id: id})
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

/* LIST Comment by IdResource */
module.exports.getByIdResource = id => {
    return commentModel
        .find({idResource: id})
        .sort({date: 'desc'})
    .then(value => {
        return value
    })
    .catch(erro => {
        return erro
    })
}

/* DELETE Comment */
module.exports.delete = id => {
    return commentModel.findOneAndDelete({_id: id})
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

