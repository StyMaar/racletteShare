'use strict';

angular.module('racletteModules', [])
	.factory('CategoryManager',['$window','$http',function($window,$http){
		var CM = {}
		//une vérification assynchrone pour savoir si on a déjà récupéré le dictionnaire des catégories ou non
		function checkCategory(callback){
			if($window.categoriesList){
				return callback($window.categoriesList);
			}else{
				$http.get('/categories').success(function(catList) {
					$window.categoriesList = catList;
					return callback($window.categoriesList);
				}).error(function(){
					console.log("impossible de récupérer la liste des catégories");
				});
			}
		};
		//le callback est une fonction qui prend le dictionnaire de catégories en paramètre
		CM.getCatList = function(callback){
			checkCategory(function(catList){
				callback(catList);
			});
		};

		//le callback est une fonction qui prend le label de la catégorie en paramètre
		CM.getCatLabelById= function(id,callback){
			checkCategory(function(catList){
				if(catList[id]){
					callback(catList[id].label);
				}
			});
		};
		CM.getCatIdByLabel=function(label){
			var catList = $window.categoriesList;
			var id;
			for(var i =0;i<catList.length;i++){
				id = i;
				if(catList[i].label===label){
					break;
				}
			}
			return id;
		};
		
		
		return CM;
	}]);
