/*
	Ce fichier contient les tests du fichier services.js
*/

var services = require('../services.js');
var mysql = require('mysql');

describe('Utilisateurs', function(){
  describe('createUser(user, callback)', function(){
	it('should manage to connect to the database',function(){
		var connection = mysql.createConnection({
			host:'localhost',
			user:'root',
			password:'1234poney',
			database:'raclette'
		});
		console.log(connection);
	});


    it('should create a user'/*,function(done){

		var connection = mysql.createConnection({
			host:'localhost',
			user:'root',
			password:'azerty',
			database:'raclette'
		});
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
				(err == null).should.be.true;
				(id == null).should.be.false;
				connection.rollback(function(){});
				done();
			})(null,connection);
		});
	}*/);

  });
});
