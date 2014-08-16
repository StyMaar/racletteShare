/*
	Ce fichier contient les tests du fichier services.js
*/


var services = require('../services.js');
var mysql = require('mysql');
var EventEmitter = require('events').EventEmitter;
var helper = require('./testHelpers.js');

var DBconnectionParams= {
  host:'localhost',
  user:'',
  password:'',
  database:'test'
};

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
    category:3
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
  describe('getItemByName(keyword, callback)', function(){ //Test disabled until moving to newer version of mySQL (no fullText index with innoDB in this version)
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
    it('should get an empty list selected from a non-existing name'/*,function(done){
      withTransaction(connection,function(connection){
        helper.withUserCreated(connection,function(user){
          services.getItemByName("caribou", function(err,rows){
            err.should.be.eql("notFound");
            rows.length.should.be.eql(0);
            done();
          })(null,connection);
        });
      });
    }*/);
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
  rollbackTransaction(connection);
});
