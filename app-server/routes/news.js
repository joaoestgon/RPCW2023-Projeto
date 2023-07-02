var express = require('express');
var router = express.Router();
var axios = require('axios');
var url = require('url');
var jwt = require('jsonwebtoken');

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

/* GET Edit News */
router.get('/edit/:newsId', verifyToken, (req,res,next) => {
    if (req.cookies.level == 'admin'){
        var q = url.parse(req.url,true).query
        console.log("FDS")
        if (q.visible!= undefined){
            var newsId = req.params.newsId
            var visibility = q.visible

            if (visibility == 'invisible')
                visibility = false
            else
                visibility = true

            axios.put('http://localhost:42069/news/' + newsId + '?token=' + req.cookies.token, {visible: visibility})
                .then(values => {
                    var decodedToken = jwt.decode(req.cookies.token, {complete: true})
                    username = decodedToken.payload.username;
                    action = "edited the news '" + newsId + "'"

                    logger(username, action)

                    res.redirect('/')
                })
                .catch(error => {
                    res.render('error',{error: error})
                })
        }
        else
            console.log('No visibility in query string.')
    }
    else
        res.render("warnings",{warnings: ["Insuficient permissions to access this page."]})
})

/* GET Delete News */
router.get('/delete/:newsId', verifyToken, (req,res,next) => {
    if (req.cookies.level == 'admin'){
        var newsId = req.params.newsId
        if (newsId != undefined){
            axios.delete('http://localhost:42069/news/' + newsId + '?token=' + req.cookies.token)
                .then(values => {
                    var decodedToken = jwt.decode(req.cookies.token,{complete:true})
                    username = decodedToken.payload.username;
                    action = "deleted the news '" + newsId + "'"

                    logger(username, action)
                    res.redirect('/')
                })
                .catch(error => {
                    console.log(error)
                    res.render('error',{error: error})
                })
        }
        else
            console.log('News not found.')
    }
    else
        res.render("warnings",{warnings:["Insuficient permissions to access this page."]})
})

module.exports = router;