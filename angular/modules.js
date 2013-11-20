'use strict';

angular.module('racletteModules', [])
	.factory('formValidation',function(){
		var fV = {};
		var mailReg = /[^@]*@[^@]*\.[a-zA-Z]{2,4}$/;
		var lengthReg = /.{3,64}/; // plus rapide qu'avec un String.length c.f. http://jsperf.com/regex-vs-string-length
		var telReg = /^[0-9\- .+]{10,17}$/;
		var descrLengthReg = /.{0,255}/;
		fV.checkLogin = function(login){
			return mailReg.test(login);
		}
		fV.checkLength = function(string){
			return string && lengthReg.test(string); // pour une raison mystérieuse, cette regex appliquée à null renvoyait true ...
		}
		fV.checkdescLength = function(string){
			return descrLengthReg.test(string);
		}
		fV.checkTel = function(tel){
			return telReg.test(tel);
		}
		return fV;
	}).factory('LoginManager',['$window','$http','$location',function($window,$http,$location){
		var LM = {}
		//une vérification assynchrone pour savoir si l'utilisateur est déjà logé ou non
		LM.checkLogin = function(logged,notlogged){
			if($window.racletteLogged_in){
				return logged();
			}else{
				$http.get('/checkLogin').success(function(isLogged) {
					$window.racletteLogged_in = true;
					return logged();
				}).error(function(){
					if(notlogged){
						//si le 2ème paramètre est une fonction , on l'execute
						if(typeof notlogged === "function"){
							return notlogged();
						}else{
							//sinon on effectue une redirection demandant de se connecter
							// TODO : faire un page spéciale, avec un message d'erreur et une redirection vers la page sur laquelle on était au moment ou on a été redirigé
							$location.path("/connexion");
							$location.replace();
						}
					}else{
						return; //si jamais il n'y a pas de 2ème paramètre, alors on ne fait rien.
					}
					return notlogged();
				});
			}
		};
		//un gestionnaire de deconnexion
		LM.disconnect= function(){
			$http.get('/deconnexion').success(function() {
				$window.racletteLogged_in = false;
				$location.path("/aurevoir");
				$location.replace();
			});
		};
		//un gestionnaire de connexion
		LM.connect = function(){
			$window.racletteLogged_in = true;
		};
		return LM;
	}]).factory('NotifManager',['$http',function($http){
		var NM = function(scope){
			//au chargement de la page, on regarde le nombre de messages non lus
			(function getUnreadMessages(){
				$http.get('/unread').success(function(data) {	
					scope.notifications = data;
				});
			})();
			//puis on fait du long polling sur l'url /notifs, pour être tenu en permanence au courant des notifications

			var limit = 25; //pour éviter les explosions du navigateur si jamais il y a une erreur au niveau du serveur ou de la connexion, on limite à 25 le nombre de tentative en erreur.
			var current = 0;
			function checkNotifs(){
				console.log("cnm called");
				$http.get('/notifs').success(function(data) {				
					if(scope.notifications){
						scope.notifications++;
					}else{
						scope.notifications = 1;
					}
					current=0;
					checkNotifs();
				}).
				error(function(a,b,c){
					current++;
					if(current<limit){
						checkNotifs();
					}
				});
			}
			return checkNotifs();
		};

		return NM;
	}]);

