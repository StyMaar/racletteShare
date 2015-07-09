'use strict';

/* Controllers */

angular.module('controllers').
	controller('mes_objetsCtrl', ['$scope','$http','LoginManager','NotifManager', function($scope,$http,LoginManager,NotifManager) {
		$scope.hiddenMessage = true;
		$scope.errorMessage = "";
		LoginManager.checkLogin(function(){
			NotifManager($scope);
			$http.get('items/my').success(function(data) {
				$scope.item_list=data;
				if(!data || data.length==0){
					$scope.hiddenMessage = false;
					$scope.errorMessage = "Vous ne partagez actuellement aucun objet. N'hésitez pas à partager vos objets avec la communauté racletteShare";
				}
			});
			$scope.clickDelete = function(itemId,index){
				$http.delete('items/detail/'+itemId).success(function(data){
					$scope.item_list.splice(index,1);
					$scope.hiddenMessage = true;
				}).error(function(data, status, headers) {
					$scope.hiddenMessage = false;
					$scope.errorMessage = "Echec de la suppression de l'élement. Veuillez réessayer."
				});
			}
		},true);
	}]);