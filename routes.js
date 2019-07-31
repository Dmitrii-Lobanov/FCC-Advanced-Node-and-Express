const passport = require('passport');

module.exports = function(app, db){
 function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()) return next();
  res.redirect('/');
}
  
  app.route('/')
    .get((req, res) => {
      res.render(process.cwd() + '/views/pug/index.pug', {
        title: 'Home page',
        message: 'Please login',
        showLogin: true,
        showRegistration: true
      });
    });
  
  app.route('/profile')
    .get(ensureAuthenticated, (req, res) =>{
      res.render(process.cwd() + '/views/pug/profile', {username: req.user.username});
  });
  
  app.route('/logout')
    .get((req, res) =>{
      req.logout();
      res.redirect('/');
  }); 
  
  
}
