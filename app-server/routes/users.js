var express = require('express');
var router = express.Router();
var axios = require('axios');
var jwt = require('jsonwebtoken');
var url = require('url');

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

/* Logger Function */
function logger(username, action){
  var log = {}

  log.user = username;
  log.date = new Date().toISOString().substring(0,16).split('T').join(' ');
  log.action = action

  axios.post(env.logAccessPoint + "/logs", log)
    .then(values => console.log("Log added."))
    .catch(error => {console.log("Log error: " + error)})
}

/* Admin - GET Users List */
router.get('/', verifyToken, function(req, res, next) {
  console.log(req.cookies.level)
  if(req.cookies.level === 'admin')
    axios.get(env.authAccessPoint + '/users?token=' + req.cookies.token)
      .then(values => {
        var users = values.data
        res.render('users', {consumers: users.cs, producers: users.ps, logged: 'true', level: req.cookies.level});
      })
      .catch(error => {console.log("Error getting System Users: " + error)})
  else
      res.render('warnings',{warnings:["Insuficient permissions to access this page."]})
});

/* --- User --- */

router.post('/profile', verifyToken, (req,res,next) => {
  axios.get(env.authAccessPoint+ '/users/profile?token=' + req.cookies.token)
    .then(values => {
      var decoded = jwt.decode(req.cookies.token, { complete: true })
      var username = decoded.payload.username
      axios.put(env.authAccessPoint+ '/users/' + username + '?token=' + req.cookies.token, req.body)
        .then(values => {
          console.log("Edit finished")
          res.redirect('/users/profile')
        })
        .catch(error => {
          console.log('Error viewing MyProfile1: ' + error)
          res.render('error', {error: error});
        })
    })
    .catch(error => {
      console.log('Error viewing MyProfile2: ' + error)
      res.render('error', {error: error});
    })
});

router.get('/profile/edit', verifyToken, (req,res,next) => {
  var decoded = jwt.decode(req.cookies.token, { complete: true })
  var username = decoded.payload.username 
  //console.log(username)
  axios.get(env.authAccessPoint+ '/users/' + username + '?token=' + req.cookies.token)
    .then(values => {
      //console.log(values)
      res.render('editProfile', {title: 'Edit profile - ' + values.data.username, user: values.data, logged: 'true', level: req.cookies.level})
    })
    .catch(error => {
      console.log('Error viewing MyProfile3: ' + error)
      res.render('error', {error: error});
    })
});

router.get('/profile', verifyToken, (req,res,next) => {
  var decoded = jwt.decode(req.cookies.token, { complete: true })
  var username = decoded.payload.username 
  //console.log(username)
  axios.get(env.authAccessPoint+ '/users/' + username + '?token=' + req.cookies.token)
    .then(values => {
      //console.log(values.data)
      axios.get(env.apiAccessPoint + '/resources?producer=' + values.data.username + '&token=' + req.cookies.token)
        .then(resources => {
          //console.log(resources.data)
          res.render('profile', {title: values.data.username + "'s profile", url: env.apiAccessPoint, user: values.data, logged: 'true', level: req.cookies.level, resources: resources.data})
        })
        .catch(error => {
          console.log("Error listing users' resources: " + error)
          res.render('error', {error: error})
        })
    })
    .catch(error => {
      console.log('Error viewing MyProfile4: ' + error)
      res.render('error', {error: error});
    })
});

router.get('/delete/:username', verifyToken, (req,res,next) => {
  var username = req.params.username
  if (username != undefined){
    axios.delete(env.authAccessPoint+ '/users/delete?username=' + username + '&token=' + req.cookies.token)
      .then(values => {
        console.log('User deleted.')
        res.redirect('/users')
      })
      .catch(error => {
        console.log('Error deleting user ' + username + ': ' + error)
        res.render('error', {error: error});
      })
  }
});

router.get('/edit', verifyToken, (req, res) => {
  var q = url.parse(req.url,true).query
  if (q.user != undefined){
    var username = q.user
    axios.get(env.authAccessPoint+ '/users/' + username + '?token=' + req.cookies.token)
      .then(values => {
        console.log(values.data)
        res.render('editUser', {title: 'Edit', user: values.data, logged:'true', level: req.cookies.level})
      })
      .catch(error => {
        console.log('Error getting user ' + username)
        res.render('error', {error: error});
      })
  }
});

router.post('/edit', verifyToken, (req, res) => {
  axios.put(env.authAccessPoint+ '/users?token=' + req.cookies.token, req.body)
    .then(values => {
      console.log(values)
      res.redirect('/users')
    })
    .catch(error => {
      console.log('Edit error: ' + error)
      res.render('error', {error: error})
    })
});

router.post('/register',(req, res) => {
  if (req.body.password == req.body.confirm_password){
    axios.post(env.authAccessPoint+ '/users/register', req.body)
        .then(values => {
          //console.log(values); 
          res.redirect('/login')
        })
        .catch(error => {
          console.log("Register error: " + error); 
        })
  }
  else {
    res.render('warnings', {warnings: ["Passwords don't match"]});
  }
})

router.post('/login', (req, res, next) => {
  console.log(req.body)
  axios.post(env.authAccessPoint+ '/users/login', req.body)
      .then(values => {
        res.cookie('token', values.data.token, {
          expires: new Date(Date.now() + '1d'),
          secure: false,
          httpOnly: true
        });
        console.log(req.body.username)
        axios.get(env.authAccessPoint+ '/users/' + req.body.username + '?token=' + values.data.token)
          .then(values => {
            res.cookie('level', values.data.level, {
              expires: new Date(Date.now() + '1d'),
              secure: false,
              httpOnly: true
            })
            res.redirect('/');
          })
          .catch(error=> {
            console.log("Error getting user: " + error)
          })
      })
      .catch(error => {
        console.log("Logging error: " + error);
        res.redirect('/login');
      })
})

router.get('/logout', verifyToken, (req,res)=> {
  var decoded = jwt.decode(req.cookies.token, {complete: true})
  console.log(req.cookies.token)
  
  user = decoded.payload.username;
  action = "logged out"
  logger(user, action)
  
  res.cookie('token', undefined);
  res.cookie('level', undefined);
  res.clearCookie('token');
  res.clearCookie('level');

  res.redirect('/');
})

module.exports = router;