var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const { v4: uuidv4 } = require('uuid')
var session = require('express-session')

var indexRouter = require('./routes/index');
var resourcesRouter = require('./routes/resources');
var usersRouter = require('./routes/users');
var newsRouter = require('./routes/news')
var logsRouter = require('./routes/logs')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(session({
  genid: req => {
    return uuidv4()},
  secret: 'RPCW2023',
  resave: true,
  saveUninitialized: true
}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/resources', resourcesRouter);
app.use('/users', usersRouter);
app.use('/news', newsRouter);
app.use('/logs', logsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

//mount your other paths
// in this case render 404.
app.get("*",function (req, res) {
  res.status(404).send("<h1>File not found</h1>");
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;