/*
	Ce fichier contient les tests du fichier services.js
*/

var services = require('../services.js');
var mysql = require('mysql');
var EventEmitter = require('events').EventEmitter;

var DBconnectionParams= {
  host:'localhost',
  user:'',
  password:'',
  database:'test'
};



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
})
