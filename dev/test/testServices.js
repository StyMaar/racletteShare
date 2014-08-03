/*
	Ce fichier contient les tests du fichier services.js
*/

var services = require('../services.js');
var mysql = require('mysql');
var DBconnectionParams= {
  host:'localhost',
  user:'',
  password:'',
  database:'test'
};

describe('Utilisateurs', function(){
  describe('createUser(user, callback)', function(){
  	it('should manage to connect to the database',function(done){
    		var connection = mysql.createConnection(DBconnectionParams);
    		connection.beginTransaction(function(err) {
          if (err) { throw err; }
          done();
        });
    });



    it('should create a user with no commit',function(done){
  		var connection = mysql.createConnection(DBconnectionParams);
  		var user = {
			login : "bm",
			name :"Bob Morane", 
  			password: "azerty",
			city:"Boston", 
			tel:"06 66 66 66 66"
  		};

  		connection.beginTransaction(function(err) {
    			if (err) { throw err; }
  			services.createUser(user,function(err,id){
  				(err === null).should.be.true;
  				(id === null).should.be.false;
  				connection.rollback(function(){});
  				done();
  			})(null,connection);
  		});
  	});

    it('should create a user with a commit',function(done){
      var connection = mysql.createConnection(DBconnectionParams);
      var user = {
        login : "lt",
        name :"Lavan Turier",
        password: "azerty",
        city:"Jungle Birmane",
        tel:"07 77 77 77 77"
      };

      connection.beginTransaction(function(err) {
          if (err) { throw err; }
        services.createUser(user,function(err,id){
          (err === null).should.be.true;
          (id === null).should.be.false;
          connection.commit(function(){});
          done();
        })(null,connection);
      });
    });

  });
});
