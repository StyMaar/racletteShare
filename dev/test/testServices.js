/*
	Ce fichier contient les tests du fichier services.js
*/


var services = require('../services.js');
var mysql = require('mysql');
var EventEmitter = require('events').EventEmitter;
var helper = require('./testHelpers.js');

var DBconnectionParams= require('../mySQLparams.js');

var categories=[
  'Coup de main',
  'Fiesta',
  'Voyage',
  'High-tech',
  'Bricolage/Jardinage',
  'Sport',
  'Maison/Cuisine',
  'Culture'
];

//Ouvre une transaction et effectue l'action callback lorsqu'elle est ouverte. Si elle est déjà ouverte, on effectue directement le callback.
function withTransaction(connection, callback){

  if(connection.transactionnal){
    callback(connection);
  }else{
    var emitter = new EventEmitter();
    emitter.once('ready', function(){
      callback(connection);
    });
    connection.beginTransaction(function(err) {
      if (err) {
        throw err;
      }
      connection.transactionnal=true;
      emitter.emit('ready');
    });
}
}

function rollbackTransaction(connection){
  connection.rollback(function(){});
  connection.transactionnal=false;
  for(var key in connection.parasite){
    delete connection[key];
  }
  delete connection.parasite;
}

var connection = mysql.createConnection(DBconnectionParams);

describe('Utilisateurs', function(){
  var user = {
    login : "bm",
    name :"Bob Morane",
    password: "azerty",
    city:"Boston",
    tel:"06 66 66 66 66"
  };

  describe('createUser(user, callback)', function(){

    it('should create a user',function(done){
      withTransaction(connection,function(connection){
  			services.createUser(user,function(err,id){
  				(err === null).should.be.true;//il ne doit pas y avoir d'erreur
  				(id === null).should.be.false;//il doit bien y avoir un id retourné
          user.id=id;
  				done();
  			})(null,connection);
      });
  	});
  });

  describe('doLogin(login, password, callback)', function(){

    it('should log in with the newly created user',function(done){
      withTransaction(connection,function(connection){
        services.doLogin(user.login,user.password,function(err,id){
          (err === null).should.be.true;//il ne doit pas y avoir d'erreur
          id.should.be.eql(user.id);
          done();
        })(null,connection);
      });
    });
    it('should not log in with a non-existing user',function(done){
      withTransaction(connection,function(connection){
        services.doLogin("poney","bob42",function(err,id){
          err.should.be.eql("forbiden");
          (id === null).should.be.true;//il ne doit pas y avoir d'id retourné
          done();
        })(null,connection);
      });
    });
  });

    describe('resetPassword(email, callback)', function(){
      it('should reset the password of the user',function(done){
        withTransaction(connection,function(connection){
          services.resetPassword(user.login,function(err,newPassword){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            (newPassword === null).should.be.false;
            (newPassword.should.not.be.eql(user.password));//le mot de passe doit avoir été changé.
            user.oldPassword = user.password;
            user.password = newPassword;
            done();
          })(null,connection);
        });
      });
      it('should not connect to the user with the old password',function(done){
        withTransaction(connection,function(connection){
          services.doLogin(user.login,user.oldPassword,function(err,id){
            err.should.be.eql("forbiden");
            (id === null).should.be.true;//il ne doit pas y avoir d'id retourné
            done();
          })(null,connection);
        });
      });
      it('should connect to the user with the new password',function(done){
        withTransaction(connection,function(connection){
          services.doLogin(user.login,user.password,function(err,id){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            id.should.be.eql(user.id);
            done();
          })(null,connection);
        });
      });
    });

    describe('changePassword(userId, oldPassword, newPassword, callback)', function(){
      it('should not change the password of the user if the given current password is not correct',function(done){
        withTransaction(connection,function(connection){
          var newPassword = "qsdfgh";
          services.changePassword(user.id,'poney',newPassword,function(err){
            err.should.be.eql("pas d'écriture dans la base de données");
            done();
          })(null,connection);
        });
      });
      it('should change the password of the user',function(done){
        withTransaction(connection,function(connection){
          var newPassword = "qsdfgh";
          services.changePassword(user.id,user.password,newPassword,function(err){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            (newPassword.should.not.be.eql(user.password));//pour vérifier que je n'ai pas remis le même par hasard.
            user.oldPassword = user.password;
            user.password = newPassword;
            done();
          })(null,connection);
        });
      });
      it('should not connect to the user with the old password',function(done){
        withTransaction(connection,function(connection){
          services.doLogin(user.login,user.oldPassword,function(err,id){
            err.should.be.eql("forbiden");
            (id === null).should.be.true;//il ne doit pas y avoir d'id retourné
            done();
          })(null,connection);
        });
      });
      it('should connect to the user with the new password',function(done){
        withTransaction(connection,function(connection){
          services.doLogin(user.login,user.password,function(err,id){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            id.should.be.eql(user.id);
            done();
          })(null,connection);
        });
      });
    });

  describe('getUserInfo(userId, callback)', function(){

    it('should get the infos from the user',function(done){
      withTransaction(connection,function(connection){
        services.getUserInfo(user.id,function(err,userData){
          userData.id.should.be.eql(user.id);
          userData.name.should.be.eql(user.name);
          userData.city.should.be.eql(user.city);
          done();
        })(null,connection);
      });
    });
  });
  rollbackTransaction(connection);
});

describe('Catégories',function(){
  describe('getCategories(callback)', function(){
    it('should get the liste of categories',function(done){
      withTransaction(connection,function(connection){
        services.getCategories(function(err,rows){
          for(var i in rows){
            categories[rows[i].id].should.be.eql(rows[i].label);
          }
          done();
        })(null,connection);
      });
    });
  });
  rollbackTransaction(connection);
});

describe('Objets',function(){
  var item = {
    nom_objet:"poney",
    description:"un poney fringant",
    category:2
  };
  describe('newItem(userId, item, callback)', function(){
    it('should create a new item',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.newItem(user.id, item, function(err,id){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            (id === null).should.be.false;//il doit bien y avoir un id retourné
            item.id=id; //pour la suite des tests, on ajoute l'id à l'item
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('getMyItem(itemId, userId, callback)', function(){
    it('should get an item from the database',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getMyItem(item.id, user.id, function(err,itemDetails){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            itemDetails.should.be.eql(item);
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('editItem(userId, item, itemId, callback)', function(){
    it('should edit an existing item',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.editItem(user.id, item, item.id, function(err){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('getItemList(userId, callback)', function(){
    it('should get the list of the items owned by a user',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getItemList(user.id, function(err,rows){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            rows.length.should.be.eql(1);
            rows[0].id.should.be.eql(item.id);
            rows[0].nom_objet.should.be.eql(item.nom_objet);
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('getItemByCategory(category, callback)', function(){
    it('should get a list of items selected by its category',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getItemByCategory(item.category, function(err,rows){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            rows.length.should.be.eql(1);
            rows[0].id.should.be.eql(item.id);
            rows[0].nom_objet.should.be.eql(item.nom_objet);
            done();
          })(null,connection);
        });
      });
    });
    it('should get an empty list selected from an empty category',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getItemByCategory(4, function(err,rows){
            err.should.be.eql("notFound");
            rows.length.should.be.eql(0);
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('getItemByName(keyword, callback)', function(){//Test disabled because it can't work in a transaction as full text indexes are updated at commit time.
    it('should get a list of items selected by its name'/*,function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getItemByName(item.nom_objet, function(err,rows){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            rows.length.should.be.eql(1);
            rows[0].id.should.be.eql(item.id);
            rows[0].nom_objet.should.be.eql(item.nom_objet);
            done();
            })(null,connection);
        });
      });
    }*/);
    it('should get an empty list selected from a non-existing name',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getItemByName("caribou", function(err,rows){
            err.should.be.eql("notFound");
            rows.length.should.be.eql(0);
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('getItemDetail(itemId,userId, callback)', function(){
    it('should get an item from the database',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getItemDetail(item.id, user.id, function(err,itemDetails){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            itemDetails.category_id.should.be.eql(item.category);
            itemDetails.category_label.should.be.eql(categories[item.category]);
            itemDetails.is_mine.should.be.eql("mine");
            itemDetails.owner_id.should.be.eql(user.id);
            itemDetails.owner_name.should.be.eql(user.name);
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('deleteItem(userId, itemId, callback)', function(){
    it('should delete an item from the database',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.deleteItem(user.id,item.id, function(err){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            done();
          })(null,connection);
        });
      });
    });
  });
  rollbackTransaction(connection);
})

describe('Demandes',function(){
  var demande = {
    nom_demande:"poney",
    description:"je cherche un poney fringant",
    category:5
  };
  describe('newDemande(userId, demande, callback)', function(){
    it('should create a new demande',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.newDemande(user.id, demande, function(err,id){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            (id === null).should.be.false;//il doit bien y avoir un id retourné
            demande.id=id; //pour la suite des tests, on ajoute l'id à l'item
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('getDemandeList(userId, callback)', function(){
    it('should get the list of the demandes owned by a user',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getDemandeList(user.id, function(err,rows){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            rows.length.should.be.eql(1);
            rows[0].id.should.be.eql(demande.id);
            rows[0].nom_demande.should.be.eql(demande.nom_demande);
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('getMyDemande(demandeId, userId, callback)', function(){
    it('should get a demande from the database',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getMyDemande(demande.id, user.id, function(err,demandeDetails){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            demandeDetails.should.be.eql(demande);
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('editDemande(userId, demande, demandeId, callback)', function(){
    it('should edit an existing demande',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.editDemande(user.id, demande, demande.id, function(err){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('getDemandeByCategory(category, callback)', function(){
    it('should get a list of demandes selected by their category',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getDemandeByCategory(demande.category, function(err,rows){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            rows.length.should.be.eql(1);
            rows[0].id.should.be.eql(demande.id);
            rows[0].nom_demande.should.be.eql(demande.nom_demande);
            done();
          })(null,connection);
        });
      });
    });
    it('should get an empty list selected from an empty category',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getDemandeByCategory(4, function(err,rows){
            err.should.be.eql("notFound");
            rows.length.should.be.eql(0);
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('getDemandeByName(keyword, callback)', function(){ //Test disabled because it can't work in a transaction as full text indexes are updated at commit time.
    it('should get a list of demandes selected by its name'/*,function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getDemandeByName(demande.nom_demande, function(err,rows){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            rows.length.should.be.eql(1);
            rows[0].id.should.be.eql(demande.id);
            rows[0].nom_demande.should.be.eql(demande.nom_demande);
            done();
          })(null,connection);
        });
      });
    }*/);
    it('should get an empty list selected from a non-existing name',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getDemandeByName("caribou", function(err,rows){
            err.should.be.eql("notFound");
            rows.length.should.be.eql(0);
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('getDemandeDetail(demandeId,userId, callback)', function(){
    it('should get an demande from the database',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getDemandeDetail(demande.id, user.id, function(err,demandeDetails){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            demandeDetails.category_id.should.be.eql(demande.category);
            demandeDetails.category_label.should.be.eql(categories[demande.category]);
            demandeDetails.is_mine.should.be.eql("mine");
            demandeDetails.owner_id.should.be.eql(user.id);
            demandeDetails.owner_name.should.be.eql(user.name);
            done();
          })(null,connection);
        });
      });
    });
  });
  describe('deleteDemande(userId, demandeId, callback)', function(){
    it('should delete a demande from the database',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.deleteDemande(user.id,demande.id, function(err){
            (err === null).should.be.true;//il ne doit pas y avoir d'erreur
            done();
          })(null,connection);
        });
      });
    });
  });
  rollbackTransaction(connection);
})

describe('Conversation',function(){
  var message = "coucou, comment ça va ?";
  describe('newMessage(itemId, myId, contactId, message, callback)', function(){
    it('should send a new message to someone',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(destinataire){
          helper.withItemCreated(connection,function(sender,item){
            services.newMessage(item.id, sender.id, destinataire.id, message, function(err){
              (err === null).should.be.true;//il ne doit pas y avoir d'erreur
              done();
            })(null,connection);
          });
        },"destinataire");
      });
    });
  });
  describe('getMessagesList(itemId,contactId,myId, callback)', function(){
    it('should get a list of message with only one message in it',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(destinataire){
          helper.withItemCreated(connection,function(sender,item){
            services.getMessagesList(item.id,destinataire.id,sender.id, function(err,msgList){
              (err === null).should.be.true;//il ne doit pas y avoir d'erreur
              msgList.length.should.be.eql(1);
              msgList[0].sender.should.be.eql("me");
              msgList[0].content.should.be.eql(message);
              (msgList[0].date === null).should.be.false;
              done();
            })(null,connection);
          });
        },"destinataire");
      });
    });
  });
  describe('getConversationsList(myId, callback)', function(){
    it('should get a list of conversation with only one conversation in it',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(destinataire){
          helper.withItemCreated(connection,function(sender,item){
            services.getConversationsList(sender.id, function(err,convList){
              (err === null).should.be.true;//il ne doit pas y avoir d'erreur
              convList.length.should.be.eql(1);
              convList[0].contact_id.should.be.eql(destinataire.id);
              convList[0].nom_contact.should.be.eql(destinataire.name);
              convList[0].item_id.should.be.eql(item.id);
              convList[0].nom_objet.should.be.eql(item.nom_objet);
              done();
            })(null,connection);
          });
        },"destinataire");
      });
    });
  });
  describe('getConversationDetail(itemId, contactId, callback)', function(){
    it('should get the details of a conversation',function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(destinataire){
          helper.withItemCreated(connection,function(sender,item){
            services.getConversationDetail(item.id,destinataire.id, function(err,convDetails){
              (err === null).should.be.true;//il ne doit pas y avoir d'erreur
              convDetails.nom_contact.should.be.eql(destinataire.name);
              convDetails.nom_objet.should.be.eql(item.nom_objet);
              done();
            })(null,connection);
          });
        },"destinataire");
      });
    });
  });

  rollbackTransaction(connection);
});
