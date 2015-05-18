'use strict';

angular.module('racletteModules', [])
	.factory('LoginManager',['$window','$http','$location',function($window,$http,$location){
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
	}]);
