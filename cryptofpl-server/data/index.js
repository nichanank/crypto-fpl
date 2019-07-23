const knex = require('knex')({
  client: 'mysql',
  connection: {
    host     : 'localhost',
    user     : 'root',
    password : process.env.MYSQL_PW,
    database : 'footballers_db',
  }
})

module.exports = knex