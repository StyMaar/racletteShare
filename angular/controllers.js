'use strict';

/* Controllers */

angular.module('controllers', ['racletteModules']).
	controller('connexionCtrl', ['$scope','$http','$location',"formValidation",'LoginManager', function($scope,$http,$location,formValidation,LoginManager) {
		$scope.hiddenMessage = true;
		$scope.errorMessages = [];
		$scope.connexionClick = function(){
			/*
				On contrôle le login (doit être un email), le mot de passe (3-64 char de long)
			*/
			$scope.errorMessages = [];
			var isItOk = true;
			if(!formValidation.checkLogin($scope.login)){
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Votre email doit être un email valide");
				isItOk = false;
			}
			if(!formValidation.checkLength($scope.password)){
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("le mot de passe doit faire au moins 3 caractères.");
				isItOk = false;
			}
			if(isItOk){
				$scope.hiddenMessage = true;
				$scope.errorMessages = [];
			}else{
				return;
			}
			$http.get('users/'+$scope.login+'/'+$scope.password).success(function() {
				LoginManager.connect();
				$location.path("/");
				$location.replace();
			}).error(function(data, status, headers) {
				$scope.hiddenMessage = false;
				$scope.errorMessages = "Connexion impossible, veuillez réessayer.";
			});
		}
	}]).
	controller('inscriptionCtrl', ['$scope','$http','$location',"formValidation",'LoginManager', function($scope,$http,$location,formValidation,LoginManager) {
		$scope.hiddenMessage = true;
		$scope.errorMessages = [];
		$scope.inscriptionClick = function(){
			/*
				On contrôle le login (doit être un email), le mot de passe (3-64 char de long) et le nom d'utilisateur (3-64 char de long)
				La ville et le téléphone sont facultatifs
			*/
			$scope.errorMessages = [];
			var isItOk = true;
			if(!formValidation.checkLogin($scope.login)){
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Votre email doit être un email valide");
				isItOk = false;
			}
			if(!formValidation.checkLength($scope.password)){
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Le mot de passe doit faire au moins 3 caractères.");
				isItOk = false;
			}
			if(!formValidation.checkLength($scope.name)){
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Votre nom d'utilisateur doit faire au moins 3 caractères.");	
				isItOk = false;	
			}
			if($scope.tel && !formValidation.checkTel($scope.tel)){ //si un numéro de tel est renseigné, on s'assure que c'est bien un numéro de tel
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Si vous souhaitez donner votre numéro de téléphone, merci d'en donner un valide");
				isItOk = false;
			}
			if(isItOk){
				$scope.hiddenMessage = true;
				$scope.errorMessages = [];
			}else{
				return;
			}
			var postData = {
				login:$scope.login,
				password:$scope.password,
				name:$scope.name,
				city:$scope.ville,
				tel:$scope.tel
			}
			$http.post('users/',postData).success(function() {
				LoginManager.connect();
				$location.path("/");
				$location.replace();
			}).error(function(data, status, headers) {
				$scope.hiddenMessage = false;
				$scope.errorMessages.push("Connexion impossible, veuillez réessayer.");
			});
		}
	}]).
	controller('dashboardCtrl', ['$scope','$http','$location','LoginManager', function($scope,$http,$location,LoginManager) {
		$scope.connected = false;
		LoginManager.checkLogin(function(){
			$scope.connected = true;
			$http.get('users/my').success(function(data) {
				$scope.name = data.name;
			});
			$scope.deconnexionClick = LoginManager.disconnect;
		},function(){
			//ce qu'on doit faire si jamais on n'est pas connecté
		});
		$http.get('/categories').success(function(data) {
			$scope.categories = data;
		});
	}]).
	controller('mon_profilCtrl', ['$scope','$http','$location','LoginManager', function($scope,$http,$location,LoginManager) {
		$http.get('users/my').success(function(data) {
			$scope.name = data.name;
			$scope.city = data.city;
		})
	}]).
	controller('mes_objetsCtrl', ['$scope','$http','$location','LoginManager', function($scope,$http,$location,LoginManager) {
		$scope.hiddenMessage = true;
		$scope.errorMessage = "";
		LoginManager.checkLogin(function(){
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
		},function(){
			$location.path("/connexion");
			$location.replace();
		});
	}]).
	controller('nouvel_objetCtrl', ['$scope','$http','$location','$window','LoginManager', function($scope,$http,$location,$window,LoginManager) {
		$scope.hiddenMessage = true;
		$scope.errorMessage = "";
		LoginManager.checkLogin(function(){	
			$http.get('/categories').success(function(data) {
				$scope.categories = data;
			});

			$scope.file = null;
			$scope.nom_objet="";
			$scope.category="";
			$scope.description=null;
		

			$window.updatePicture = function(elem) {
				var file = elem.files[0]; //le fichier lui même
				var reader = new FileReader();
				// Closure to capture the file information.
				reader.onload = (function(theFile,element) {
					return function(e) {
						$scope.file= theFile;
						$scope.imgB64=e.target.result,
						$scope.imgName=escape(theFile.name);
						$scope.$digest(); //met à jour les vues avec le nouveau scope
					};
				})(file,elem);
				// Read in the image file as a data URL.
		  		reader.readAsDataURL(file);
			}

			$scope.submit = function(){
				
				success(function (data, status, headers, config) {
					$location.path("/items/my");
					$location.replace();
				}).
				error(function (data, status, headers, config) {
					$scope.hiddenMessage = false;
					$scope.errorMessage = "Echec de la création de l'objet. Veuillez réessayer.";
				});
			};
		},function(){
			$location.path("/connexion");
			$location.replace();
		});
		
	}]).
	controller('edit_objetCtrl', ['$scope','$http','$location','$routeParams','$timeout','LoginManager', function($scope,$http,$location,$routeParams,$timeout, LoginManager) {
		$scope.hiddenMessage = true;
		$scope.errorMessage = "";
		$scope.itemId = $routeParams.itemId;
		LoginManager.checkLogin(function(){	
			$http.get('/categories').success(function(data) {
				$scope.categories = data;
			});

			$http.get('/items/detail/'+$scope.itemId).success(function(data) {				
				$scope.nom_objet=data.name;
				$scope.category=data.category;
				$scope.description=data.description;
			}).
			error(function(){
				$scope.hiddenMessage = false;
				$scope.errorMessage = "Objet introuvable";
				$scope.submit = function(){}; //on désactive le bouton d'envoi
				//et on redirige l'utilisateur vers la liste de ses objets
				$timeout(function(){
					$location.path("/items/my");
					$location.replace();
				},2500);
			});

			$scope.submit = function(){
				var putData = {
					nom_objet:$scope.nom_objet,
					category:$scope.category,
					description:$scope.description
				}
				
				$http.put('/items/detail/'+$scope.itemId,putData).success(function (data, status, headers, config) {
					$location.path("/items/my");
					$location.replace();
				}).
				error(function (data, status, headers, config) {
					$scope.hiddenMessage = false;
					$scope.errorMessage = "Echec de la mise à jour de l'objet. Veuillez réessayer.";
				});
			};
		},function(){
			$location.path("/connexion");
			$location.replace();
		});
		
	}]).
	controller('recherche_categoryCtrl', ['$scope','$http','$routeParams', function($scope,$http,$routeParams) {
		$scope.hiddenMessage = true;
		$scope.errorMessage = "";
		$scope.category = $routeParams.category;
		$http.get('/items/category/'+$scope.category).success(function(data) {				
			$scope.item_list = data;
		}).
		error(function(data, status){
			console.log(data);
			console.log(status);
			$scope.hiddenMessage = false;
			$scope.errorMessage = "Aucun objet trouvé autour de chez vous dans cette catégorie";
		});	
	}]);
