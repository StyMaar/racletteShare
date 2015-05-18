'use strict';

angular.module('racletteModules', [])
	.factory('NotifManager',['$http',function($http){
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
	}])
