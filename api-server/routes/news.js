var express = require('express');
var router = express.Router();

var newsController = require('../controllers/newsController')

//var url = require('url')
var jwt = require('jsonwebtoken');

/* Verify Token Function */
function verifyToken(req, res, next){
    var myToken = req.query.token || req.body.token;

    jwt.verify(myToken, 'RPCW2023', function(e, payload){
        if(e){
        res.status(450).jsonp({error: 'Token verification error: ' + e})
        }
        else {
        next()
        } 
    })
}

function verifyAuthLevel(a ,req, res, next){
  if(a.includes(req.user.level))
    next()
  else
    res.status(460).jsonp({error: "Access Level: NOT AUTHORIZED."})
}

/*
// PUT noticia (alterar o nome do user) 
router.put('/atualizarUser', verifyToken, (req,res,next) => {
  var userAntigo = req.body.userAntigo;
  var userNovo = req.body.userNovo;
  newsController.atualizarNome(userAntigo, userNovo)
    .then(dados => {
      res.status(200).jsonp(dados)
    })
    .catch(e => res.status(514).jsonp({error: e}))
})
*/

/* GET News */
router.get('/', verifyToken, function(req, res, next) {
    newsController.list()
        .then(values => res.status(200).jsonp(values))
        .catch(e => res.status(530).jsonp({error: e}))
});

/* POST News */
router.post('/', verifyToken, function(req, res, next) {
    newsController.insert(req.body)
    .then(values => res.status(200).jsonp(values))
    .catch(e => res.status(531).jsonp({error: e}))
});

/* PUT News */
router.put('/:id', verifyToken, function(req, res, next){
    verifyAuthLevel(["admin","producer"], req, res, next)
    }, 
    (req, res, next) => {
        newsController.getById(req.params.id)
            .then(values => {
                next()
            })
            .catch(error => {
                console.log(error)
                res.status(532).jsonp({error: error})
            })
    }, 
    (req, res) => {
        var id = req.params.id
        var vis = req.body.visible

        if (vis != undefined) {
            newsController.update(id, vis)
                .then(values => res.status(204).jsonp(values))
                .catch(error => res.status(533).jsonp({error: error}))
        } else {
            return res.status(534).jsonp({error: 'Visibilty Status Missing.'})
        }
    }
)

/* DELETE News */
router.delete('/:id', verifyToken, function(req, res, next){
    verifyAuthLevel(["admin"], req, res, next)
    }, 
    (req, res, next) => {
    newsController.getById(req.params.id)
        .then(values => {
            next()
        })
        .catch(error => {
            console.log(error)
            res.status(535).jsonp({error: error})
        })
    }, 
    (req,res) => {
        newsController.delete(req.params.id)
            .then(values => res.status(200).jsonp(values))
            .catch(error => res.status(536).jsonp({error: error}))
})

module.exports = router;