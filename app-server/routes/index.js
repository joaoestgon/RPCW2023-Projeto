var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var axios = require('axios');

var env = require('../config/env')

/* Verify Token Function */
function verifyToken(req, res, next){
  var myToken = req.cookies.token;

  jwt.verify(myToken, 'RPCW2023', function(e, payload){
    if(e){
      res.status(450).jsonp({error: 'Token verification error: ' + e})
    }
    else {
      next()
    } 
  })
}

/* GET home page. */
router.get('/', (req, res, next) => {
  if(req.cookies.token != undefined){
    console.log("Homepage")
    axios.get(env.apiAccessPoint + '/news?token=' + req.cookies.token)
      .then(values => {
        var news = values.data
        console.log(news.length)
        res.render('index', {title: 'Homepage', logged: 'true', level: req.cookies.level, news: news});
      })
      .catch(error => {
        console.log(error)
        res.render('error', {error: error})
      })
  }
  else
    res.render('index', {title: 'Homepage'})
});

router.get('/register', (req,res) => {
  res.render('register');
})

router.get('/upload', verifyToken, (req,res) => {
  if (['admin','producer'].includes(req.cookies.level))
    res.render('upload', {logged: 'true', level:req.cookies.level});
  else
    res.render('error', {error: {status: 401}, message: 'Access Level: NOT AUTHORIZED - Unable to upload resource.'})
})

router.get('/login',(req,res)=>{
  res.render('login');
})

module.exports = router;