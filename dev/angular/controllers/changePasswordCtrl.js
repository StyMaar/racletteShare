'use strict';

/* Controllers */

angular.module('controllers', ['racletteModules']).
	controller('changePasswordCtrl', ['$scope','$http','$location',"formValidation",'LoginManager', function($scope,$http,$location,formValidation,LoginManager) {
		$scope.hiddenMessage = true;
		$scope.errorMessages = [];
		$scope.request = false;
		$scope.success = true;
		$scope.changePasswordClick = function(){
			/*
				le mot de passe (3-64 char de long)
			*/
			$scope.errorMessages = [];
			if(!formValidation.checkLength($scope.newPassword)){
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("le mot de passe doit faire au moins 3 caractères.");
				return;
			}
			$scope.hiddenMessage = true;
			$scope.errorMessages = [];
			
			var postData = {
				oldPassword:$scope.oldPassword,
				newPassword:$scope.newPassword,
			}
			
			$http.post("/users/changePassword", postData).success(function() {
				$scope.request = true;
				$scope.success = false;
			}).error(function(data, status, headers) {
				$scope.hiddenMessage = false;
				$scope.errorMessages = ["Échec de la réinitialisation du mot de passe: l'ancien mot de passe n'est pas le bon."];
			});
		}
	}]);
