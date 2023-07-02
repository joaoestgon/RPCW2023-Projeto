var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController')
var userModel = require('../models/userModel')
var passport = require('passport')
var jwt = require('jsonwebtoken')

const { createHash } = require('crypto');
var axios = require('axios');
var url = require('url');

function verifyToken(req, res, next){
  var myToken = req.query.token || req.body.token
  if(myToken){
    jwt.verify(myToken, "RPCW2023", function(e, payload){
      if(e){
        res.status(401).json({error: e})
      }
      else{ 
        req.user = {}
        req.user.username = payload.username
        req.user.level = payload.level
        next()
      }
    })
  }
  else
    res.status(401).jsonp({error: "Token not found."})
}

function logger(username, action){
  var logHost = 'http://localhost:42369'
  var log = {}

  log.user = username;
  log.date = new Date().toISOString().substring(0,16).split('T').join(' ');
  log.action = action

  axios.post(logHost + "/logs", log)
    .then(values => console.log("Log added."))
    .catch(err => {console.log("Log error: " + err)})
}

/* GET List Users */
router.get('/', verifyToken, (req, res, next) => {
  console.log(req.user)
  if (req.user.level =='admin'){
    next();
  } 
  else{
    res.status(400).jsonp({error: "Required Access Level: admin."})
  }
}, (req, res) => {
  userController.listByLevel('producer')
    .then(producers => {
      userController.listByLevel('consumer')
        .then(consumers => {
          //console.log(consumers)
          res.status(200).jsonp({ps: producers, cs: consumers})
        })
        .catch(error => res.status(501).jsonp({error: error}))
    })
    .catch(error => res.status(502).jsonp({error: error}))
});

router.get('/:username', verifyToken, (req, res, next) => {
  //console.log(req.params.username)
  userController.getUser(req.params.username)
    .then(u => {
      res.jsonp(u)
    })
    .catch(err => {
      res.jsonp({error: err, message: "Error getting user..."})
    })
});

router.post('/register', (req, res) => {
  var date = new Date().toISOString().substring(0,16)
  hashedPwd = createHash('sha256').update(req.body.password).digest('hex');
  
  if (req.body.level == undefined)
    req.body.level = 'consumer'

  if (req.body.affiliation == undefined)
    req.body.affiliation = 'N/A'

  userModel.register(
    new userModel({
      username: req.body.username,
      password: hashedPwd,
      email: req.body.email,
      affiliation: req.body.affiliation,
      name: req.body.name,
      level: req.body.level,
      dateCreated: date
    }),
    hashedPwd,
    function(err, user){
      if (err)
        res.jsonp({error: err, message: "Register error: " + err})
      else
        res.jsonp('OK')
    }
  )

  logger(req.body.username, 'registered')
})

router.post('/login', (req, res, next) => {
  //console.log(req.body)
  passport.authenticate('local', (err,user,info) => {
    //console.log(err)
    //console.log(user)
    if(err)
      return next(err);
    if(!user){
      console.log(info.message)
      return res.status(401).jsonp({erro:info.message});
    }
    jwt.sign({
      username: user.username,
      level: user.level,
      sub: 'RPCW2023'},
      "RPCW2023",
      {expiresIn: '1d'},
      function(e, token){
        if (e){
          res.status(500).jsonp({error: "Erro na geração do token: " + err})
        }
        else{
          res.status(200).jsonp({token: token})
        } 
    })
    logger(user.username, 'logged in')
  })
  (req, res, next)
});

router.put('/:id', verifyToken, (req, res, next) => {
  const updateObj = {};
  // Check each field in the info object and add it to the update object if it has a non-empty value
    Object.entries(req.body).forEach(([key, value]) => {
        if (value !== '') {
        updateObj[key] = value;
        }
    });
  userController.updateUser(req.params.id, updateObj)
      .then(u => {
        res.jsonp(u)
      })
      .catch(err => {
        res.jsonp({error: err, message: "Erro na alteração do utilizador " + req.params.id})
      })
})

/* PUT user level */
/* CHECK */
router.put('/', verifyToken, (req, res, next) => {
  var username = req.body.username

  if (username != undefined){
    if (req.user.level == "admin")
    {
      next();
    }
    else{
      res.status(400).jsonp({error: "Required Access Level: admin."})
    }
  }
  else{
    return res.status(500).jsonp({error: 'User Not Found.'})
  }
}, (req, res) => {
  var username = req.body.username
  var level = req.body.level

  if (level){
    userController.updateUserLevel(username, level)
      .then(values => {
        action = "changed the user level of " + username
        logger(req.body.username, action)
  
        res.status(200).jsonp({values: values})
    })
      .catch(error => res.status(500).jsonp({error: error}))
  } else {
    return res.status(500).jsonp({error: 'Missing level.'})
  }
})


router.delete('/delete', verifyToken, (req, res, next) => {
  console.log("delete")
  var q = url.parse(req.url,true).query
  var username = q.username 

  if (username != undefined){
    if (req.user.level == "admin" || req.user.username == username){
      next();
    }
    else{
      res.status(400).jsonp({error: "Required Access Level: admin."})
    }
  }
  else{
    return res.status(500).jsonp({error: 'User Not Found.'})
  }
}, (req, res) => {
  var q = url.parse(req.url,true).query
  var del_username = q.username 

  console.log(q.username)

  userController.deleteUser(q.username)
  .then(values => {
    action = 'deleted the user ' + del_username
    logger(req.body.username, action)
    console.log(values)
    res.jsonp(values)
  })
  .catch(err => {
    res.jsonp({error: err, message: "Erro na remoção do utilizador " + req.params.id})
  })
});

module.exports = router;