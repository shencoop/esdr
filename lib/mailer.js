var config = require('../config');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var log = require('log4js').getLogger();

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport(smtpTransport({
                                                              host : config.get("mail:smtp:host"),
                                                              port : config.get("mail:smtp:port"),
                                                              auth : {
                                                                 user : config.get("mail:smtp:login"),
                                                                 pass : config.get("mail:smtp:password")
                                                              }
                                                           }));

var createSenderFromClient = function(client) {
   return {
      name : client.displayName || config.get("mail:sender:name"),
      email : client.email || config.get("mail:sender:email")
   };
};

module.exports = {

   /**
    * Sends the verification email to the given recipient from the given client.  Sending is done "asynchronously", upon
    * the next process tick.
    */
   sendVerificationEmail : function(client, recipientEmail, verificationToken) {
      // send the email later
      process.nextTick(function() {
         var sender = createSenderFromClient(client);

         // build the verification URL, inserting the token into it
         var verificationUrl = client.verificationUrl || "";
         verificationUrl = verificationUrl.replace(/\:verificationToken/gi, verificationToken);

         log.debug("Sending verification email from: [" + sender.email + "] to [" + recipientEmail + "]");

         // build the email
         var mailOptions = {
            from : sender.name + " <" + sender.email + ">",             // sender address
            to : recipientEmail,                                        // list of receivers
            subject : 'Verify your account',                            // Subject line
            text : 'Please verify your account by opening this URL in your browser: ' + verificationUrl, // plaintext body
            html : 'Please <a href="' + verificationUrl + '">click this link</a> to verify your account.' // html body
         };

         // send mail with defined transport object
         transporter.sendMail(mailOptions, function(err, mailResult) {
            if (err) {
               log.error("Error sending verification email to [" + recipientEmail + "]: " + err);
            }
            else {
               log.info("Verification email sent to [" + recipientEmail + "].  Result: " + JSON.stringify(mailResult, null, 3));
            }
         });
      });
   },

   /**
    * Sends the password reset email to the given recipient from the given client.  Sending is done "asynchronously",
    * upon the next process tick.
    */
   sendPasswordResetEmail : function(client, recipientEmail, resetPasswordToken) {
      // send the email later
      process.nextTick(function() {
         var sender = createSenderFromClient(client);

         // build the verification URL
         var resetPasswordUrl = client.resetPasswordUrl || "";
         resetPasswordUrl = resetPasswordUrl.replace(/\:resetPasswordToken/gi, resetPasswordToken);

         log.debug("Sending reset password email from: [" + sender.email + "] to [" + recipientEmail + "]");

         // build the email
         var mailOptions = {
            from : sender.name + " <" + sender.email + ">",             // sender address
            to : recipientEmail,                                        // list of receivers
            subject : 'Reset your password',                            // Subject line
            text : 'Hello,\n\n' +
                   'You are receiving this email because you (or someone else) submitted a request to reset your password. ' +
                   'Please click the following link, or copy and paste it into your browser to submit a new password.  This link will expire in 1 hour:\n\n' +
                   '      ' + resetPasswordUrl + '\n\n' +
                   'If you did not request a password reset, please simply ignore this email and your password will remain unchanged.',
            html : 'Hello,<br><br>' +
                   'You are receiving this email because you (or someone else) submitted a request to reset your password. ' +
                   'Please click the following link, or copy and paste it into your browser to submit a new password.  This link will expire in 1 hour:<br><br>' +
                   '&nbsp;&nbsp;&nbsp;<a href="' + resetPasswordUrl + '">'+resetPasswordUrl+'</a><br><br>' +
                   'If you did not request a password reset, please simply ignore this email and your password will remain unchanged.'
         };

         // send mail with defined transport object
         transporter.sendMail(mailOptions, function(err, mailResult) {
            if (err) {
               log.error("Error sending reset password email to [" + recipientEmail + "]: " + err);
            }
            else {
               log.info("Reset password email sent to [" + recipientEmail + "].  Result: " + JSON.stringify(mailResult, null, 3));
            }
         });
      });
   }

};

