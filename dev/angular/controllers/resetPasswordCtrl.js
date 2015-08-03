'use strict';

/* Controllers */

angular.module('controllers').
	controller('resetPasswordCtrl', ['$scope','$http','$location',"formValidation", function($scope,$http,$location,formValidation) {
		$scope.hiddenMessage = true;
		$scope.errorMessages = [];
		$scope.request = false;
		$scope.success = true;
		$scope.resetPassword = function(){
			/*
				On contrôle l'email, le mot de passe (3-64 char de long)
			*/
			$scope.errorMessages = [];
			if(!formValidation.checkEmail($scope.email)){
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Votre email doit être un email valide");
				return;
			}else{
				$scope.hiddenMessage = true;
				$scope.errorMessages = [];
			}
			$scope.request = true;
			$scope.success = false;
			$http.get('users/'+$scope.email);//on n'attend pas la réponse du serveur avant d'afficher le message de succès
			
		};
	}]);
