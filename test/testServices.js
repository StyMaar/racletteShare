/*
	Ce fichier contient les tests du fichier services.js
*/

var services = require('../services.js');

describe('Utilisateurs', function(){
  describe('createUser(user, callback)', function(){
    it('should create a user',function(){
		var user = {
			login : "bm",
			name :"Bob Morane", 
			password: "azerty", 
			city:"Boston", 
			tel:"06 66 66 66 66"
		};
		services.createUser(user,function(err,id){
			(err == null).should.be.true;
			(id == null).should.be.false;
		});
	})
  })
})
