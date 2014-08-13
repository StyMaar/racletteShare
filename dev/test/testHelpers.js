/*
fichier contenant des utilitaires pour les tests.
*/

var services = require('../services.js');
var EventEmitter = require('events').EventEmitter;

/*
Crée un utilisateur de test et effectue l'action callback lorsqu'il est créé. S'il est déjà créé, on effectue directement le callback.
callback est une fonction f(user)
*/
exports.withUserCreated = function(connection, callback){

  if(connection.userCreated){
    callback(connection.userCreated);
  }else{
    var emitter = new EventEmitter();
    emitter.once('ready', function(){
      callback(connection.userCreated);
    });
    var user = {
      login : "kc",
      name :"John Doe",
      password: "azerty",
      city:"Courseulles sur Mer",
      tel:"06 21 21 21 21"
    };
    services.createUser(user,function(err,id){
      (err === null).should.be.true;//il ne doit pas y avoir d'erreur
      (id === null).should.be.false;//il doit bien y avoir un id retourné
      user.id=id;
      connection.userCreated=user;
      if(err){
        throw err;
      }
      emitter.emit('ready');
    })(null,connection);
  }
};
