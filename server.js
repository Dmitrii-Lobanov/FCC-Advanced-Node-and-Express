'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');

const app = express();
const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb').MongoClient;

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
	session({
		secret: process.env.SECRET_SESSION,
		resave: true,
		saveUninitialized: true
	})
);
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'pug');

mongo.connect('mongodb+srv://dm:<password>@cluster0-5ox1o.mongodb.net/test?retryWrites=true&w=majority', (err, db) =>{
  if(err){
    console.log('Database error: ' + err);
  } else{
    console.log('Successful database connection');
    
    passport.serializeUser((user, done) =>{
      done(null, user._id);
    });

    passport.deserializeUser((id, done) =>{
      db.collection('users').findOne(
        {_id: new ObjectID(id)},
        (err, doc) => {
          done(null, doc);
        }
      );
    });
   
    app.route('/')
      .get((req, res) => {
        res.render(process.cwd() + '/views/pug/index.pug', {
          title: 'Home page',
          message: 'Please login'
        });
    });
    
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
    
  }
});
