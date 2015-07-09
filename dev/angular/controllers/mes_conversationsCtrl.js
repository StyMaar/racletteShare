'use strict';

/* Controllers */

angular.module('controllers').
	controller('mes_conversationsCtrl', ['$scope','$http','$routeParams','LoginManager','$location','$timeout', function($scope,$http,$routeParams,LoginManager,$location,$timeout) {
		$scope.hiddenMessage = true;
		$scope.errorMessage = "";
		LoginManager.checkLogin(function(){
			$http.get('/messages/conversations').success(function(data) {
				$scope.liste_conversations = data;
			}).
			error(function(){
				$scope.hiddenMessage = false;
				$scope.errorMessage = "Erreur";
				$timeout(function(){
					$location.path("/");
					$location.replace();
				},2500);
			});
		},true);
	}]);
