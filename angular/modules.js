'use strict';

angular.module('racletteModules', [])
	.factory('formValidation',function(){
		var fV = {};
		var mailReg = /[^@]*@[^@]*\.[a-zA-Z]{2,4}$/;
		var lengthReg = /.{3,64}/; // plus rapide qu'avec un String.length c.f. http://jsperf.com/regex-vs-string-length
		var telReg = /^[0-9\- .+]{10,17}$/;
		fV.checkLogin = function(login){
			return mailReg.test(login);
		}
		fV.checkLength = function(string){
			return string && lengthReg.test(string); // pour une raison mystérieuse, cette regex appliquée à null renvoyait true ...
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

