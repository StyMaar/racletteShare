'use strict';

/* Controllers */

angular.module('controllers').
	controller('recherche_categoryCtrl', ['$scope','$http','$routeParams','$timeout','LoginManager','NotifManager','CategoryManager', function($scope,$http,$routeParams,$timeout, LoginManager, NotifManager, CategoryManager) {
		LoginManager.checkEmail(function(){
			NotifManager($scope);
		});
		$scope.hiddenMessage = true;
		$scope.errorMessage = "";
		CategoryManager.getCatLabelById($routeParams.category, function(catLabel){
			$scope.category = catLabel;
		});
		$http.get('/items/category/'+$routeParams.category).success(function(data) {
			$scope.item_list = data;
		}).
		error(function(data, status){
			console.log(data);
			console.log(status);
			$scope.hiddenMessage = false;
			$scope.errorMessage = "Aucun objet trouvé autour de chez vous dans cette catégorie";
		});
	}]);