var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');
var path = require('path');

var cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');

// --- Ligação ao MongoDB ---

var mongoose = require('mongoose')
var mongoDB = 'mongodb://127.0.0.1/RPCW2023Projeto'
// --- Tentativa Docker ---
// var mongoDB = process.env.MONGODB_URL;
mongoose.connect(mongoDB, {useNewURLParser: true, useUnifiedTopology: true})
var db = mongoose.connection
db.on('error', function(){
  console.log("Erro de conexão ao MongoDB...")
})
db.on('open', function(){
  console.log("Conexão ao MongoDB realizada com sucesso...")
})

// ---

var commentsRouter = require('./routes/comments');
var resourcesRouter = require('./routes/resources');
var newsRouter = require('./routes/news');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Verifica token no pedido
app.use(function(req, res, next){
  var myToken = req.query.token || req.body.token
  if(myToken){
    jwt.verify(myToken, "RPCW2023", function(e, payload){
      if(e){
        res.status(450).jsonp({error: e})
      }
      else{
        req.user = {}
        req.user.username = payload.username
        req.user.level = payload.level
        next()
      }
    })
  }
  else{
    res.status(451).jsonp({error: "Token inexistente!"})
  }
})

app.use('/comments', commentsRouter);
app.use('/resources', resourcesRouter);
app.use('/news', newsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.jsonp({error: err});
});

module.exports = app;
