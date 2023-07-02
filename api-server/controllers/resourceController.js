var mongoose = require('mongoose')
var resourceModel = require('../models/resource')


// Inserir recurso
module.exports.insert = r => {
    return resourceModel.create(r)
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

// Listar recursos
module.exports.getResources = () => {
    return resourceModel.find()
        .sort({ title: 'asc' })
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

// Listar recurso por id
module.exports.getById = id => {
    return resourceModel.findOne({ _id: id })
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

// Listar recursos por idProducer
module.exports.getByidProducer = sid => {
    return resourceModel
        .find({ idProducer: sid })
        .sort({ title: 'asc' })
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

// Listar recursos que contenham uma palavra(s) no titulo
module.exports.getByTitle = tit => {
    return resourceModel
        .find({ title: new RegExp(tit, 'i') })
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

// Listar recursos por Autor
module.exports.getByAuthor = author => {
    return resourceModel
        .find({ authors: author })
        .sort({ title: 'asc' })
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

// Listar recurso por tipo
module.exports.getByType = t => {
    return resourceModel
        .find({ type: t })
        .sort({ title: 'asc' })
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

// Listar reviews de um User
module.exports.reviewsByUser = id => {
    return resourceModel
        .find({ "reviews.idUser": id })
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

// procurar uma review de um user num recurso
module.exports.userReview = (rid, uid) => {
    return resourceModel.findOne({ _id: rid, 'reviews.idUser': uid })
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

// Eliminar recurso
module.exports.delete = id => {
    return resourceModel.deleteOne({ _id: id })
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

// post review
module.exports.postReview = (rid, uid, value) => {
    return resourceModel.updateOne(
            { _id: rid },
            { $push: { reviews: { idUser: uid, value: value } } })
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

// update review
module.exports.updateReview = (rid, uid, value) => {
    return resourceModel.updateOne(
            { _id: rid, 'reviews.idUser': uid },
            { $set: { 'reviews.$.value': value } }
            )
        .then(value => {
            return value
        })
        .catch(erro => {
            return erro
        })
}

// update resource
module.exports.updateResource = (rid, type, title, description) => {
    const filter = { _id: rid };
    const update = {};
    
    if (type) {
        update.type = type;
      }
      if (title) {
        update.title = title;
      }
      if (description) {
        update.description = description;
      }
    
      updatedResource = resourceModel.updateOne(filter, update);
      
      return updatedResource
        .then(value => {
            console.log("deu")
            return value
        })
        .catch(error => {
            return error
        }) 
    
}

