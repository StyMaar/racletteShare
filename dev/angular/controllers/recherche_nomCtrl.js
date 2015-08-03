'use strict';

/* Controllers */

angular.module('controllers').
	controller('recherche_nomCtrl', ['$scope','$http','$routeParams','$timeout','LoginManager','NotifManager', function($scope,$http,$routeParams,$timeout, LoginManager, NotifManager) {
		LoginManager.checkEmail(function(){
			NotifManager($scope);
		});
		$scope.hiddenMessage = true;
		$scope.errorMessage = "";
		$scope.keyword = $routeParams.keyword;
		$http.get('/items/keyword/'+$scope.keyword).success(function(data) {
			$scope.item_list = data;
		}).
		error(function(data, status){
			console.log(data);
			console.log(status);
			$scope.hiddenMessage = false;
			$scope.errorMessage = "Aucun objet trouvé autour de chez vous pour ces mots clés";
		});
	}]);
