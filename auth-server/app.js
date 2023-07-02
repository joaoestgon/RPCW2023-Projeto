var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');

// --- Imports de Sessão ---

const { v4: uuidv4 } = require('uuid')
var session = require('express-session')
var FileStore = require('session-file-store')(session)
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

const { createHash } = require('crypto');

// ---

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

var usersRouter = require('./routes/users');

var app = express();

// --- Configuração da Sessão ---

app.use(session({
  genid: req => {
    return uuidv4()},
  secret: 'RPCW2023',
  resave: false,
  saveUninitialized: true
}))

// --- Configuração do passport ---

var userController = require('./controllers/userController')
//passport.use(new LocalStrategy(userController.authenticate()))
passport.use(new LocalStrategy(
  {usernameField: 'username'}, (username, password, done) => {
    encPwd = createHash('sha256').update(password).digest('hex');
    userController.getUser(username)
      .then(values => {
        const user = values
        if(!user) { return done(null, false, {message: 'User not found.'})}
        if(encPwd != user.password) {
          console.log(encPwd)
          console.log(user)
          console.log(user.password)
          return done(null, false, {message: 'Incorrect Login Info.'})}
        return done(null, user)
      })
      .catch(e => done(e))
    })
)

var userModel = require('./models/userModel')
passport.serializeUser(userModel.serializeUser())
passport.deserializeUser(userModel.deserializeUser())


/*
passport.serializeUser((user,done) => {
  console.log('Serialized user: ' + user.username)
  done(null, user.username)
})
passport.deserializeUser((uname, done) => {
  console.log('Desserialized user username: ' + uname)
  userController.getUser(uname)
    .then(values => done(null, values))
    .catch(err => done(err, false))
})
*/

// ---

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Depois de configurar as sessões
app.use(passport.initialize());
app.use(passport.session());

app.use('/users', usersRouter);

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
