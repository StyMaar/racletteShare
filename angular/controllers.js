'use strict';

/* Controllers */

angular.module('controllers', ['racletteModules']).
  controller('connexionCtrl', ['$scope','$http','$location',"formValidation", function($scope,$http,$location,formValidation) {
	$scope.hiddenMessage = true;
	$scope.errorMessage = [];
	$scope.connexionClick = function(){
		/*
			On contrôle le login (doit être un email), le mot de passe (3-64 char de long)
		*/
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
			$scope.errorMessage = [];
		}else{
			return;
		}
		$http.get('users/'+$scope.login+'/'+$scope.password).success(function() {
			$location.path("/");
			$location.replace();
		}).error(function(data, status, headers) {
			$scope.hiddenMessage = false;
			$scope.errorMessage = "Connexion impossible, veuillez réessayer.";
		});
	}
  }]).
  controller('inscriptionCtrl', ['$scope','$http','$location',"formValidation","errorMessages", function($scope,$http,$location,formValidation,errorMessages) {
	$scope.hiddenMessage = true;
	$scope.errorMessages = [];
	$scope.inscriptionClick = function(){
		/*
			On contrôle le login (doit être un email), le mot de passe (3-64 char de long) et le nom d'utilisateur (3-64 char de long)
			La ville et le téléphone sont facultatifs
		*/
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
			$scope.errorMessage = [];
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
			$scope.errorMessage = "Connexion impossible, veuillez réessayer.";
		});
	}
  }]);
