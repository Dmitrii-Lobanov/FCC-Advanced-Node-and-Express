const express     = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function(app, db){
  app.route('/login')
    .post(passport.authenticate('local', {failureRedirect: '/'}), (req, res) =>{
      res.redirect('/profile');
  });

  app.route('/register')
    .post((req, res, next) =>{
      var hash = bcrypt.hashSync(req.body.password, 12);
      db.collection('users').findOne({username: req.body.username}, function(err, user){
          if(err) next(err);
          else if(user) res.redirect('/');
          else{
            db.collection('users').insertOne(
              {username: req.body.username,
              password: hash},
              function(err, doc){
                if(err) {
                  res.redirect('/');
                } else {
                  next(null, user);
                }
              }
            )
          }
        }
      )
  },
  passport.authenticate('local', {failureRedirect: '/'}), 
  (req, res, next) => res.redirect('/profile')         
);
}
