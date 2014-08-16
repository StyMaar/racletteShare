/*
fichier contenant des utilitaires pour les tests.
*/

var services = require('../services.js');
var EventEmitter = require('events').EventEmitter;

/*
Crée un utilisateur de test et effectue l'action callback lorsqu'il est créé. S'il est déjà créé, on effectue directement le callback.
le paramètre userType est optionnel, et permet de créer un ou plusieurs utilisateur supplémentaire avec la même fonction
callback est une fonction f(user)
*/
exports.withUserCreated = function(connection, callback, userName){
  userName=userName||"userCreated";

  if(connection[userName]){
    callback(connection[userName]);
  }else{
    var emitter = new EventEmitter();
    emitter.once('ready', function(){
      callback(connection[userName]);
    });
    var user = {
      name :"John Doe",
      password: "azerty",
      city:"Courseulles sur Mer",
      tel:"06 21 21 21 21"
    };
    user.login=userName;
    user.name +=" "+userName;
    services.createUser(user,function(err,id){
      (err === null).should.be.true;//il ne doit pas y avoir d'erreur
      (id === null).should.be.false;//il doit bien y avoir un id retourné
      user.id=id;
      connection[userName]=user;
      if(err){
        throw err;
      }
      emitter.emit('ready');
    })(null,connection);
  }
};

/**
Crée un item de test et effectue l'action callback lorsqu'il est créé. S'il est déjà créé, on effectue directement le callback.
callback = f(user,item)
*/
exports.withItemCreated = function(connection, callback){
  exports.withUserCreated(connection,function(user){
    if(connection.itemCreated){
      callback(user,connection.itemCreated);
    }else{
      var emitter = new EventEmitter();
      emitter.once('ready', function(){
        callback(user,connection.itemCreated);
      });

      var item = {
        nom_objet:"Kalachnikov",
        description:"AK-47 Kalachnikov, un fusil d'assaut robuste et efficace",
        category:3
      };
      services.newItem(user.id,item,function(err,id){
        (err === null).should.be.true;//il ne doit pas y avoir d'erreur
        (id === null).should.be.false;//il doit bien y avoir un id retourné
        item.id=id;
        connection.itemCreated=item;
        if(err){
          throw err;
        }
        emitter.emit('ready');
      })(null,connection);
    }
  });
};
