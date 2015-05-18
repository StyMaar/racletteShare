'use strict';

/* Controllers */

angular.module('controllers', ['racletteModules']).
	controller('detail_objetCtrl', ['$scope','$http','$routeParams','$location','LoginManager','NotifManager', function($scope,$http,$routeParams,$location, LoginManager, NotifManager) {
		LoginManager.checkLogin(function(){
			NotifManager($scope);
		});
		$scope.hiddenMessage = true;
		$scope.errorMessage = "";
		$scope.itemId = $routeParams.itemId;
		$http.get('/items/detail/'+$scope.itemId).success(function(data) {
			$scope.nom_objet=data.nom_objet;
			$scope.category= {
				label:data.category_label,
				id:data.category_id
			};
			$scope.description=data.description;
			$scope.contactName=data.owner_name;
			$scope.contactId=data.owner_id;
			$scope.isMine = data.is_mine;
		}).
		error(function(){
			$scope.hiddenMessage = false;
			$scope.errorMessage = "Objet introuvable";
			$scope.submit = function(){}; //on désactive le bouton d'envoi
			//et on redirige l'utilisateur vers la liste de ses objets
			$timeout(function(){
				$location.path("/");
				$location.replace();
			},2500);
		});
	}]);