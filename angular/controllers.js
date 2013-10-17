'use strict';

/* Controllers */

angular.module('controllers', ['racletteModules']).
	controller('connexionCtrl', ['$scope','$http','$location',"formValidation", function($scope,$http,$location,formValidation) {
		$scope.hiddenMessage = true;
		$scope.errorMessages = [];
		$scope.connexionClick = function(){
			/*
				On contrôle le login (doit être un email), le mot de passe (3-64 char de long)
			*/
			$scope.errorMessages = [];
			var isItOk = true;
			if(!formValidation.checkLogin($scope.login)){
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
			$http.get('users/'+$scope.login+'/'+$scope.password).success(function() {
				$location.path("/");
				$location.replace();
			}).error(function(data, status, headers) {
				$scope.hiddenMessage = false;
				$scope.errorMessages = "Connexion impossible, veuillez réessayer.";
			});
		}
	}]).
	controller('inscriptionCtrl', ['$scope','$http','$location',"formValidation", function($scope,$http,$location,formValidation) {
		$scope.hiddenMessage = true;
		$scope.errorMessages = [];
		$scope.inscriptionClick = function(){
			/*
				On contrôle le login (doit être un email), le mot de passe (3-64 char de long) et le nom d'utilisateur (3-64 char de long)
				La ville et le téléphone sont facultatifs
			*/
			$scope.errorMessages = [];
			var isItOk = true;
			if(!formValidation.checkLogin($scope.login)){
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Votre email doit être un email valide");
				isItOk = false;
			}
			if(!formValidation.checkLength($scope.password)){
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Le mot de passe doit faire au moins 3 caractères.");
				isItOk = false;
			}
			if(!formValidation.checkLength($scope.name)){
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Votre nom d'utilisateur doit faire au moins 3 caractères.");	
				isItOk = false;	
			}
			if($scope.tel && !formValidation.checkTel($scope.tel)){ //si un numéro de tel est renseigné, on s'assure que c'est bien un numéro de tel
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Si vous souhaitez donner votre numéro de téléphone, merci d'en donner un valide");
				isItOk = false;
			}
			if(isItOk){
				$scope.hiddenMessage = true;
				$scope.errorMessages = [];
			}else{
				return;
			}
			var postData = {
				login:$scope.login,
				password:$scope.password,
				name:$scope.name,
				city:$scope.ville,
				tel:$scope.tel
			}
			$http.post('users/',postData).success(function() {
				$location.path("/");
				$location.replace();
			}).error(function(data, status, headers) {
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Connexion impossible, veuillez réessayer.");
			});
		}
	}]).
	controller('dashboardCtrl', ['$scope','$http','$location', function($scope,$http,$location) {
		$scope.connected = false;
		$http.get('users/my').success(function(data) {
			$scope.name = data.name;
			$scope.connected = true;
		}).error(function(){
			$scope.connected = false;
		});
		$scope.deconnexionClick = function(){
			$http.get('/deconnexion').success(function() {
				$location.path("/aurevoir");
				$location.replace();
			});
		}
	}]);
