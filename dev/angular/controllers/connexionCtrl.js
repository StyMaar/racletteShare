'use strict';

/* Controllers */

angular.module('controllers', ['racletteModules']).
	controller('connexionCtrl', ['$scope','$http','$location',"formValidation",'LoginManager', function($scope,$http,$location,formValidation,LoginManager) {
		$scope.hiddenMessage = true;
		$scope.errorMessages = [];
		$scope.connexionClick = function(){
			/*
				On contrôle l'email (doit être un email), le mot de passe (3-64 char de long)
			*/
			$scope.errorMessages = [];
			var isItOk = true;
			if(!formValidation.checkEmail($scope.email)){
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Votre email doit être un email valide");
				isItOk = false;
			}
			if(!formValidation.checkLength($scope.password)){
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("le mot de passe doit faire au moins 3 caractères.");
				isItOk = false;
			}
			if(isItOk){
				$scope.hiddenMessage = true;
				$scope.errorMessages = [];
			}else{
				return;
			}
			$http.get('users/'+$scope.email+'/'+$scope.password).success(function() {
				LoginManager.connect();
				$location.path("/");
				$location.replace();
			}).error(function(data, status, headers) {
				$scope.hiddenMessage = false;
				$scope.errorMessages = ["Connexion impossible, veuillez réessayer."];
			});
		}
	}]);
