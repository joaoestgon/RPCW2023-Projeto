var User = require('../models/userModel')

module.exports.list = () => {
    return User
            .find()
            .sort({username: 1})
            .then(resp => {
                return resp
            })
            .catch(err => {
                return err
            })
}

module.exports.listByLevel = level => {
    return User
            .find({level: level})
            .sort({username: 1})
            .then(resp => {
                return resp
            })
            .catch(err => {
                return err
            })
}

module.exports.getUser = username => {
    return User.findOne({username: username})
            .then(resp => {
                console.log(resp)
                return resp
            })
            .catch(err => {
                return err
            })
}

module.exports.updateUser = (id, info) => {
    return User.updateOne({_id: id}, { $set: info })
            .then(resp => {
                return resp
            })
            .catch(err => {
                return err
            })
}

module.exports.updateUserPassword = (username, pwd) => {
    return User.updateOne({username: username}, pwd)
            .then(resp => {
                return resp
            })
            .catch(err => {
                return err
            })
}

module.exports.getUserPassword = username => {
    return User.findOne({username: username}).select({ "hash": 1, "_id": 0})
            .then(resp => {
                return resp
            })
            .catch(err => {
                return err
            })
}

module.exports.updateUserLevel = (username, level) => {
    return User.updateOne({username: username},{$set: {level: level}})
        .then(resp => {
            return resp
        })
        .catch(err => {
            return err
        })
}

module.exports.deleteUser = username => {
    return User.findOneAndDelete({_id:username})
            .then(resp => {
                return resp
            })
            .catch(err => {
                return err
            })
}