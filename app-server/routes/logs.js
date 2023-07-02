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

router.get("/",verifyToken, (req,res,next)=>{
    if(req.cookies.level != 'admin'){
        res.render('warnings',{warnings:["Insuficient permissions to access this page."]})
    }
    else{
        axios.get(env.logAccessPoint + "/logs")
            .then(values => {
                sorted = values.data.sort((a,b) => (a.id <= b.id) ? 1 : -1)
                res.render("logs", {logs:sorted, logged:'true', level:req.cookies.level})
            })
            .catch(err => {
                console.log("Error getting logs: " + err);
                res.render('error',{error:err})
            })
    }
})

router.post("/", verifyToken, (req,res,next)=>{
    if(req.cookies.level != 'admin'){
        res.render('warnings',{warnings:["Insuficient permissions to access this page."]})
    }
    else{
        axios.post(env.logAccessPoint + "/logs", req.body)
            .then(values => {
                console.log("Logs posted.")
            })
            .catch(err => {
                console.log("Error posting logs: " + err);
                res.render('error',{error:err})
            })
    }
});

router.get("/delete/:id",verifyToken, (req, res, next)=>{
    if(req.cookies.level != 'admin'){
        res.render('warnings', {warnings: ["Insuficient permissions to access this page."]})
    }
    else{
        axios.delete(env.logAccessPoint + "/logs/" + req.params.id, req.body)
            .then(values => {
                console.log("Log deleted.")
                res.redirect("/logs")
            })
            .catch(err => {
                console.log("Error deleting log: " + err);
                res.render('error', {error: err})
            })
    }
})

module.exports=router;