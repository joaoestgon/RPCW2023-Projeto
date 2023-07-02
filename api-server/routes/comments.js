var express = require('express');
var router = express.Router();

var commentController = require('../controllers/commentController')
var url = require('url')
var jwt = require('jsonwebtoken');

// É melhor verificar o token em todas as rotas que precisam de login por causa dos acessos vindos do Postman

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

/* GET comment ByIdResource */
router.get('/:id', verifyToken, (req, res, next) => {
  commentController.getByIdResource(req.params.id)
    .then(values => res.status(200).jsonp(values))
    .catch(e => res.status(520).jsonp({error: e}))
});
  
/* POST comment */
router.post('/', verifyToken, (req, res, next) => {
  commentController.insert(req.body)
  .then(values => res.status(201).jsonp(values))
  .catch(e => res.status(521).jsonp({error: e}))
});

/* DELETE comment */
router.delete('/:id', verifyToken, (req,res,next) => {
  var id = req.params.id
  var q = url.parse(req.url,true).query

  commentController.getById(id)
    .then(values => {
      console.log(values.idUser)
      if(req.user.level == 'admin' || q.user == values.idUser){
        next()
      }
      else{
        res.status(550).jsonp({error: error})
      }
  })
      .catch(error => {
          res.status(522).jsonp({error: error})
      })
}, (req,res,next) => {
    var id = req.params.id
    commentController.delete(id)
        .then(values => res.status(200).jsonp(values))
        .catch(error => res.status(523).jsonp({error: error}))
})

module.exports = router;