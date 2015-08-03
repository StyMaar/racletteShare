'use strict';

/* Controllers */

angular.module('controllers').
	controller('dashboardCtrl', ['$scope','$http','LoginManager','NotifManager','CategoryManager', function($scope, $http, LoginManager, NotifManager, CategoryManager) {
		$scope.connected = false;
		LoginManager.checkEmail(function(){
			NotifManager($scope);
			$scope.connected = true;
			$http.get('users/my').success(function(data) {
				$scope.name = data.name;
			});
			$scope.deconnexionClick = LoginManager.disconnect;
		});//si on n'est pas connecté, il ne se passe rien
		CategoryManager.getCatList(function(catList) {
			$scope.categories = catList;
		});
	}]);