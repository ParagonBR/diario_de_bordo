const express = require("express")
const mariadb = require('mariadb');
const session = require('express-session')
const cors = require("cors")
const MongoStore = require('connect-mongo')

const app = express();
const env = require('dotenv')
env.config()


let sessionOptions = session({
  secret: "Frase Aleatoria",
  resave: false,
  store: MongoStore.create({
    mongoUrl: process.env.URL_BANCO,
  }),
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 1000 * 60 * 5,
    httpOnly: true
  }
})
app.use(sessionOptions)
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
//   res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
//   next();
// });

//instancia da conexão

const pool = mariadb.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.SENHA,
  database: process.env.BANCO,
  idleTimeout: 10
});

const pool24 = mariadb.createPool({
  host: process.env.HOST24,
  user: process.env.USER24,
  password: process.env.SENHA24,
  database: '',
  idleTimeout: 10
});


exports.pool24 = pool24;

exports.pool = pool;


app.set('views', 'views')
app.set('view engine', 'ejs')
//Middlewares//
app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({
  extended: false
}))
app.listen(8080);

exports.app = app