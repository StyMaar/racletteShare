var email = require("emailjs");
var mailSettings = require('./mailParams');
var server = email.server.connect(mailSettings);

module.exports = function(email, password){
    server.send({
            text: "Here is your new password: "+password, 
            from: "RacletteShare password recovery <noreply@racletteshare.com>", 
            to: "someone <"+email+">",
            subject: "RacletteShare password recovery"
        }, function(err, message) {
            console.log(err || message);
    });
};