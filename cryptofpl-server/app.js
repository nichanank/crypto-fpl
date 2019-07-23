const express = require('express')
const cors = require('cors')

const createError = require('http-errors')
const path = require('path')

const app = express()
const indexRoute = require('./routes')
const apiRoute = require('./routes/api')

app.use(cors())
app.use('/api', apiRoute)
app.use('/', indexRoute)

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.send('hello from the other side')
})

app.listen(4001, () => {
  console.log("Footballer server listening on port 4001")
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app