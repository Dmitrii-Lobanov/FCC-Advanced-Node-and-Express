'use strict';

const routes = require('./routes.js');
const auth = require('./auth.js');

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');

const app = express();
const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb').MongoClient;

const bcrypt = require('bcrypt');

const githubStrategy = require('passport-github').Strategy;

const localStrategy = require('passport-local');

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

if (process.env.ENABLE_DELAYS) app.use((req, res, next) => {
  switch (req.method) {
    case 'GET':
      switch (req.url) {
        case '/logout': return setTimeout(() => next(), 500);
        case '/profile': return setTimeout(() => next(), 700);
        default: next();
      }
    break;
    case 'POST':
      switch (req.url) {
        case '/login': return setTimeout(() => next(), 900);
        default: next();
      }
    break;
    default: next();
  }
});

const url = 'mongodb+srv://dm:qwer@cluster0-5ox1o.mongodb.net/test';

mongo.connect(process.env.DATABASE, { useNewUrlParser: true }, (err, db) =>{
  if(err){
    console.log('Database error: ' + err);
  } else{
    console.log('Successful database connection');
    routes(app,  db);
    auth(app, db);
    
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
  }
  
  io.on('connection', socket =>{
  console.log('A user has connected');
});
  
  passport.use(new localStrategy(
    function(username, password, done){
      db.collection('users').findOne({username: username}, function(err, user){
          console.log('User ' + username + ' attempted to log in.');
          if(err) return done(err);
          if(!user) return done(null, false);
          if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
          return done(null, user);
        })
    }
  ));
  
  passport.use(new githubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'https://glitch.com/~classy-artichoke/auth/github/callback'
    },
    function(accessToken, refreshToken, profile, cb){
      console.log(profile);
      db.collection('socialUsers').findAndModify(
        {id: profile.id},
        {},
        {$setOnInsert: {
          id: profile.id,
          name: profile.displayName || 'John Doe',
          photo: profile.photos[0].value || '',
          email: profile.emails[0].value || 'No public email',
          created_on: new Date(),
          provider: profile.provider || ''
        }, $set: {
          last_login: new Date()
        }, $inc: {
          login_count: 1
        }},
        {upsert: true, new: true},
        (err, doc) =>{
          return cb(null, doc.value);
        }
      );
    }                              
  ))
  
  app.route('/auth/github')
    .get(passport.authenticate('github'));
  
  app.route('/auth/github/callback')
    .get(passport.authenticate('github', {failureRedirect: '/'}), (req, res) => {
      res.redirect('/profile');
  });
  
  
  
  app.use((req, res, next) =>{
    res.status(404)
      .type('text')
      .send('Not found');
  });
    
  app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port " + process.env.PORT);
  });  
 
});
