var mongoose = require('mongoose')
var newsModel = require('../models/news')

/*
module.exports.inserir = noticia =>{
    var novaNoticia = new newsModel(noticia)
    novaNoticia._id = new mongoose.Types.ObjectId()
    return novaNoticia.save()
}
*/

/*
//Atualizar o nome de um user
module.exports.atualizarNome = (userAntigo,userNovo) =>{
    return newsModel
        .updateMany({nome:userAntigo},{nome:userNovo},{new:true})
        .exec()
}
*/

/* LIST News */
module.exports.list = () => {
    return newsModel
        .find()
        .sort({timestamp:'desc'})
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

/* NEW News */
module.exports.insert = c => {
    return newsModel.create(c)
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

/* GET News by Id */
module.exports.getById = id => {
    return newsModel.findOne({_id: id})
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

/* UPDATE Visibility */
module.exports.update = (id, vis) => {
    return newsModel.updateOne({_id: id}, {visible: vis})
    .then(value => {
        return value
    })
    .catch(erro => {
        return erro
    })
}

/* DELETE News */
module.exports.delete = id => {
    return newsModel.deleteOne({_id: id})
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}