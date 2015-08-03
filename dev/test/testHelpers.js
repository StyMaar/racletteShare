/*
fichier contenant des utilitaires pour les tests.
*/

// pour que jshint ne rale pas avec les `should.be.true`
//jshint -W030

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
    user.email=userName;
    user.name +=" "+userName;
    services.createUser(user,function(err,id){
      (err === null).should.be.true;//il ne doit pas y avoir d'erreur
      (id === null).should.be.false;//il doit bien y avoir un id retourné
      user.id=id;
      connection[userName]=user;
      connection.parasite=connection.parasite||[];//on crée un objet qui va lister toutes les propriétés qu'on ajoute à une connexion pour y stocker des choses. Ces propriétés devront être supprimées lors du roolback de la transaction.
      connection.parasite.push(userName);
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
        connection.parasite=connection.parasite||[];//on crée un objet qui va lister toutes les propriétés qu'on ajoute à une connexion pour y stocker des choses. Ces propriétés devront être supprimées lors du roolback de la transaction.
        connection.parasite.push("itemCreated");
        if(err){
          throw err;
        }
        emitter.emit('ready');
      })(null,connection);
    }
  });
};
/**
Crée un item de test et effectue l'action callback lorsqu'il est créé. S'il est déjà créé, on effectue directement le callback.
callback = f(user,item)
*/
exports.withDemandeCreated = function(connection, callback){
  exports.withUserCreated(connection,function(user){
    if(connection.demandeCreated){
      callback(user,connection.demandeCreated);
    }else{
      var emitter = new EventEmitter();
      emitter.once('ready', function(){
        callback(user,connection.demandeCreated);
      });

      var demande = {
        nom_demande:"Kalachnikov",
        description:"AK-47 Kalachnikov, un fusil d'assaut robuste et efficace",
        category:3
      };
      services.newDemande(user.id, demande, function(err,id){
        (err === null).should.be.true;//il ne doit pas y avoir d'erreur
        (id === null).should.be.false;//il doit bien y avoir un id retourné
        demande.id=id;
        connection.demandeCreated=demande;
        connection.parasite=connection.parasite||[];//on crée un objet qui va lister toutes les propriétés qu'on ajoute à une connexion pour y stocker des choses. Ces propriétés devront être supprimées lors du roolback de la transaction.
        connection.parasite.push("demandeCreated");
        if(err){
          throw err;
        }
        emitter.emit('ready');
      })(null,connection);
    }
  });
};
