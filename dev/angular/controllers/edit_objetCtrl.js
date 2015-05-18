'use strict';

/* Controllers */

angular.module('controllers', ['racletteModules']).
	controller('edit_objetCtrl', ['$scope','$http','$location','$routeParams','$timeout','LoginManager','NotifManager','formValidation', 'CategoryManager', function($scope,$http,$location,$routeParams,$timeout, LoginManager, NotifManager, formValidation, CategoryManager) {
		$scope.hiddenMessage = true;
		$scope.errorMessages = [];
		$scope.loadingErr="";
		$scope.itemId = $routeParams.itemId;
		LoginManager.checkLogin(function(){
			NotifManager($scope);
			CategoryManager.getCatList(function(catList) {
				$scope.categories = catList.map(function(a){
					return a.label;
				}); //transforme [{id:1,label:"toto"},{id:2,label:"bob"}] en ["toto","bob"]
			});

			$http.get('/items/my/detail/'+$scope.itemId).success(function(data) {
				$scope.nom_objet=data.nom_objet;
				CategoryManager.getCatLabelById(parseInt(data.category,10),function(label){
					$scope.category=label;
				});
				$scope.description=data.description;
			}).
			error(function(){
				$scope.hiddenMessage = false;
				$scope.loadingErr="Objet introuvable";
				$scope.errorMessages.push("Objet introuvable");
				$scope.submit = function(){}; //on désactive le bouton d'envoi
				//et on redirige l'utilisateur vers la liste de ses objets
				$timeout(function(){
					$location.path("/items/my");
					$location.replace();
				},2500);
			});

			$scope.submit = function(){
				var isItOk = true;
				if(!formValidation.checkdescLength($scope.description)){
					$scope.hiddenMessage = false;
					$scope.errorMessages.push("La description ne doit pas dépasser 255 caractères.");
					isItOk = false;
				}
				if(!formValidation.checkLength($scope.nom_objet)){
					$scope.hiddenMessage = false;
					$scope.errorMessages.push("le nom de l'objet dois être compris entre 3 et 64 caractères de long.");
					isItOk = false;
				}
				if(isItOk){
					$scope.hiddenMessage = true;
					$scope.errorMessages = [];
				}else{
					return;
				}
				var putData = {
					nom_objet:$scope.nom_objet,
					category:CategoryManager.getCatIdByLabel($scope.category),
					description:$scope.description
				}

				$http.put('/items/detail/'+$scope.itemId,putData).success(function (data, status, headers, config) {
					$location.path("/items/my");
					$location.replace();
				}).
				error(function (data, status, headers, config) {
					$scope.hiddenMessage = false;
					$scope.errorMessages.push("Echec de la mise à jour de l'objet. Veuillez réessayer.");
				});
			};
		},true);

	}]);