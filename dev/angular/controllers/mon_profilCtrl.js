'use strict';

/* Controllers */

angular.module('controllers', ['racletteModules']).
	controller('mon_profilCtrl', ['$scope','$http','LoginManager','NotifManager', function($scope,$http,LoginManager,NotifManager) {
		LoginManager.checkLogin(function(){
			NotifManager($scope);
			$http.get('users/my').success(function(data) {
				$scope.name = data.name;
				$scope.city = data.city;
			})
		},true);
	}]);
