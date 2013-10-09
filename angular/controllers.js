'use strict';

/* Controllers */

angular.module('controllers', ['racletteModules']).
  controller('connexionCtrl', ['$scope','$http','$location', function($scope,$http,$location) {
	$scope.hiddenMessage = true;
	$scope.errorMessage = "";
	$scope.connexionClick = function(){
		$http.get('users/'+$scope.login+'/'+$scope.password).success(function() {
			$location.path("/");
			$location.replace();
		}).error(function(data, status, headers) {
			$scope.hiddenMessage = false;
			$scope.errorMessage = "Connexion impossible, veuillez réessayer."
		});
	}
  }]);
