var express = require('express');
var router = express.Router();
var resourceController = require('../controllers/resourceController')
var url = require('url')
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

function verifyAuthLevel(a ,req,res,next){
  if(a.includes(req.user.level))
    next()
  else
    res.status(460).jsonp({error: "Access Level: NOT AUTHORIZED."})
}

/* GET home page. */
router.get('/', verifyToken, function(req, res, next) {
  var q = url.parse(req.url,true).query
  // procurar por tipo
  if (q.type != undefined){
    var type = q.type
    resourceController.getByType(type)
      .then(values => {
        // console.log('Resposta: ' + values)
        res.status(200).jsonp(values)
      })
      .catch(e => res.status(503).jsonp({error: e}))
  } 
  // procurar por titulo
  else if(q.search!= undefined){
    var tit = q.search
    resourceController.getByTitle(tit)
      .then(values => {
        // console.log('Resposta: ' + values)
        res.status(200).jsonp(values)
      })
      .catch(e => res.status(504).jsonp({error: e}))
  } 
  // procurar por Producer
  else if (q.pid != undefined){
    var pid = q.pid
    //console.log(pid)
    resourceController.getByidProducer(pid)
      .then(values => {
        // console.log(values)
        res.status(200).jsonp(values)
      })
      .catch(error => res.status(510).jsonp(error))
  }
  else {
    resourceController.getResources()
      .then(values =>{
        // console.log('Resposta: ' + values)
        res.status(200).jsonp(values)
      })
      .catch(e => res.status(500).jsonp({error: e}))
  }
});

/* GET recurso por rid. */
router.get('/:rid', verifyToken, function(req, res, next) {
  var rid = req.params.rid
  console.log(rid)
  resourceController.getById(rid)
    .then(values => res.status(200).jsonp(values))
    .catch(e => res.status(502).jsonp({error: e}))
});

/* DELETE de um recurso */
router.delete('/:rid', verifyToken, 
  function(req,res,next) {
      var rid = req.params.rid
      resourceController.getById(rid)
        .then(values => {
          resource = values
          if (req.user.nivel == "admin" || resource.idProducer == req.user.username) {
            next()
          } else {
            res.status(401).jsonp({error: "Permission denied"})
          }
        })
        .catch(error => {
          res.status(507).jsonp({error:error})
        })
}, function(req,res) {
      var rid = req.params.rid 
      resourceController.delete(rid)
        .then(dados => {
          res.status(200).jsonp(dados)
        })
        .catch(error => {
          res.status(506).jsonp({error:error})
        })
    })


/* POST de um recurso. */
router.post('/', verifyToken, function(req,res,next) {verifyAuthLevel(["admin","produtor"], req,res,next)}
, function(req, res) {
      resourceController.insert(req.body)
        .then(values => {
          // console.log(values)
          res.status(201).jsonp(values)
        })
        .catch(e => {
          // console.log(e)
          res.status(501).jsonp({error: e})
        })
});

/* atualiza tipo, titulo ou descricao */
router.put('/:rid', verifyToken, function(req,res,next){verifyAuthLevel(["admin","producer"], req,res,next)}, function(req,res,next) {
  var rid = req.params.rid
  resourceController.getById(rid)
    .then(values => {
      //console.log(values)
      //console.log(req.user)
      
      if(req.user.nivel == "admin" || values.idProducer == req.user.username) {
        next()
      } else {
        res.status(401).jsonp({error: "Permission denied"})
      }
    })
    .catch(error => {
      console.log(error)
      
      res.status(505).jsonp({error: error})
    })
}, function(req, res) {
  var { type, title, description } = req.body
  var rid = req.params.rid

  resourceController.updateResource(rid, type, title, description)
    .then(values => res.status(204).jsonp(values))
    .catch(error => res.status(508).jsonp({error: error}))
  
});

// fazer uma review
router.put('/:rid/review', verifyToken, (req,res,next)=>{
  resourceController.userReview(req.params.rid, req.user.username)
    .then(values => {
      console.log("if")
      if (values != null){ 
        resourceController.updateReview(req.params.rid, req.user.username, req.body.review)
        .then(dados => {
            res.status(200).jsonp(dados);
          })
          .catch(err => {
            res.status(513).jsonp({error: err})
          })
      }
      else {
        resourceController.postReview(req.params.rid, req.user.username, req.body.review)
          .then(dados => {
            res.status(200).jsonp(dados);
          })
          .catch(err => {
            res.status(513).jsonp({error: err})
          })
        }
      })
})

module.exports = router;
