var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
   if (req.isAuthenticated()) {
      res.redirect('home');
   }
   else {
      res.render('login', { title : "ESDR" });
   }
});

module.exports = router;
