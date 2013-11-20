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
				$scope.errorMessages = ["Connexion impossible, veuillez réessayer."];
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
	controller('dashboardCtrl', ['$scope','$http','LoginManager','NotifManager', function($scope,$http,LoginManager,NotifManager) {
		$scope.connected = false;
		LoginManager.checkLogin(function(){
			NotifManager($scope);
			$scope.connected = true;
			$http.get('users/my').success(function(data) {
				$scope.name = data.name;
			});
			$scope.deconnexionClick = LoginManager.disconnect;
		});//si on n'est pas connecté, il ne se passe rien
		$http.get('/categories').success(function(data) {
			$scope.categories = data;
		});
	}]).
	controller('mon_profilCtrl', ['$scope','$http','LoginManager','NotifManager', function($scope,$http,LoginManager,NotifManager) {
		LoginManager.checkLogin(function(){
			NotifManager($scope);
			$http.get('users/my').success(function(data) {
				$scope.name = data.name;
				$scope.city = data.city;
			})
		},true);
	}]).
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
	}]).
	controller('nouvel_objetCtrl', ['$scope','$http','$location','$window','LoginManager','NotifManager','formValidation', function($scope, $http, $location, $window, LoginManager, NotifManager,formValidation) {
		$scope.hiddenMessage = true;
		$scope.errorMessages = [];
		$scope.hiddenWarning = true;
		$scope.warningMessage = "";
		$scope.hidePic = true;
		LoginManager.checkLogin(function(){
			var isItOk = true;
			$http.get('/categories').success(function(data) {
				$scope.categories = data;
			});
			NotifManager($scope);
			$scope.file = null;
			$scope.nom_objet="";
			$scope.category="";
			$scope.description=null;

			$window.updatePicture = function(elem) {
				var file = elem.files[0]; //le fichier lui même
				if(file.size>5000000){
					isItOk = false;
					$scope.hiddenMessage = false;
					$scope.errorMessages.push("L'image est trop grande. Veuillez réessayer avec un fichier plus petit.");
				}else{
					isItOk=true;
					$scope.hiddenMessage = true;
					$scope.errorMessages = [];
				}
				var reader = new FileReader();
				// Closure to capture the file information.
				reader.onload = (function(theFile,element) {
					return function(e) {
						$scope.file= theFile;
						$scope.imgB64=e.target.result,
						$scope.imgName=escape(theFile.name);						
						$scope.hidePic = false;
						$scope.$digest(); //met à jour les vues avec le nouveau scope
					};
				})(file,elem);
				// Read in the image file as a data URL.
		  		reader.readAsDataURL(file);
			}

			$scope.submit = function submission(){
				if(!formValidation.checkdescLength($scope.description)){
					$scope.hiddenMessage = false;
					$scope.errorMessages.push("La description ne doit pas dépasser 255 caractères.");
					isItOk = false;
				}
				if(!formValidation.checkLength($scope.nom_objet)){
					$scope.hiddenMessage = false;
					$scope.errorMessages.push("le nom de l'objet ne doit pas excéder 64 caractères de long.");
					isItOk = false;
				}
				if(isItOk){
					$scope.hiddenMessage = true;
					$scope.errorMessages = [];
				}else{
					return;
				}
				$scope.hiddenWarning = false;
				$scope.warningMessage = "Transfert de la photo en cours, veuillez patienter.";
				$scope.submit = function(){}; //on neutralise le bouton submit pendant le temps que ça charche
				$http({
				    method: 'POST',
				    url: "/items",
				    //IMPORTANT!!! You might think this should be set to 'multipart/form-data' 
				    // but this is not true because when we are sending up files the request 
				    // needs to include a 'boundary' parameter which identifies the boundary 
				    // name between parts in this multi-part request and setting the Content-type 
				    // manually will not set this boundary parameter. For whatever reason, 
				    // setting the Content-type to 'false' will force the request to automatically
				    // populate the headers properly including the boundary parameter.
				    headers: { 'Content-Type': false },
				    //This method will allow us to change how the data is sent up to the server
				    // for which we'll need to encapsulate the model data in 'FormData'
				    transformRequest: function (data) {
				        var formData = new FormData();
				        formData.append("nom_objet", data.nom_objet);
				        formData.append("category", data.category);
				        formData.append("description", data.description);
				        //now add the assigned file
				        formData.append("photo", data.file);
				        return formData;
				    },
				    //Create an object that contains the model and files which will be transformed
				    // in the above transformRequest method
				    data: {
						nom_objet:$scope.nom_objet,
						category:$scope.category,
						description:$scope.description, 
						file: $scope.file
					}
				}).
				success(function (data, status, headers, config) {
					$location.path("/items/my");
					$location.replace();
				}).
				error(function (data, status, headers, config) {
					$scope.submit = submission;
					$scope.hiddenWarning = true;
					$scope.warningMessage = "";
					$scope.hiddenMessage = false;
					$scope.errorMessages.push("Echec de la création de l'objet. Veuillez réessayer.");
				});
			};
		},true);
		
	}]).
	controller('edit_objetCtrl', ['$scope','$http','$location','$routeParams','$timeout','LoginManager','NotifManager','formValidation', function($scope,$http,$location,$routeParams,$timeout, LoginManager, NotifManager, formValidation) {
		$scope.hiddenMessage = true;
		$scope.errorMessages = [];
		$scope.loadingErr="";
		$scope.itemId = $routeParams.itemId;
		LoginManager.checkLogin(function(){
			NotifManager($scope);
			$http.get('/categories').success(function(data) {
				$scope.categories = data;
			});

			$http.get('/items/my/detail/'+$scope.itemId).success(function(data) {				
				$scope.nom_objet=data.name;
				$scope.category=data.category;
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
					$scope.errorMessages.push("le nom de l'objet ne doit pas excéder 64 caractères de long.");
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
					category:$scope.category,
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
		
	}]).
	controller('recherche_categoryCtrl', ['$scope','$http','$routeParams','$timeout','LoginManager','NotifManager', function($scope,$http,$routeParams,$timeout, LoginManager, NotifManager) {
		LoginManager.checkLogin(function(){
			NotifManager($scope);
		});			
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
	}]).
	controller('recherche_nomCtrl', ['$scope','$http','$routeParams','$timeout','LoginManager','NotifManager', function($scope,$http,$routeParams,$timeout, LoginManager, NotifManager) {
		LoginManager.checkLogin(function(){
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
	}]).
	controller('detail_objetCtrl', ['$scope','$http','$routeParams','$location','LoginManager','NotifManager', function($scope,$http,$routeParams,$location, LoginManager, NotifManager) {
		LoginManager.checkLogin(function(){
			NotifManager($scope);
		});			
		$scope.hiddenMessage = true;
		$scope.errorMessage = "";
		$scope.itemId = $routeParams.itemId;
		$http.get('/items/detail/'+$scope.itemId).success(function(data) {				
			$scope.nom_objet=data.name;
			$scope.category=data.category;
			$scope.description=data.description;
			$scope.contactName=data.ownerName;
			$scope.contactId=data.ownerId;
			$scope.isMine = data.isMine;
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
	}]).
	controller('detail_conversationCtrl', ['$scope','$http','$routeParams','LoginManager','$location','$timeout','$window','NotifManager', function($scope,$http,$routeParams,LoginManager,$location,$timeout,$window, NotifManager) {
		$scope.hiddenMessage = true;
		$scope.errorMessage = "";
		$scope.itemId = $routeParams.itemId;
		$scope.contactId = $routeParams.contactId;
		var limit = 25; //pour éviter les explosions du navigateur (chrome en fait) si jamais il y a une erreur au niveau du serveur ou de la connexion, on limite à 25 le nombre de tentative en erreur.
		var current = 0;
		function checkNewMsg(){
			console.log("cnm called");
			$http.get('/waitMessage/'+$scope.itemId+'/'+$scope.contactId).success(function(data) {				
				$scope.messages_list.push(data);
				current=0;
				checkNewMsg();
			}).
			error(function(a,b,c){
				current++;
				if(current<limit){
					checkNewMsg();
				}
			});
		}

		LoginManager.checkLogin(function(){
			NotifManager($scope);	
			$http.get('/messages/'+$scope.itemId+'/'+$scope.contactId).success(function(data) {				
				$scope.nom_objet = data.nom_objet;
				$scope.nom_contact = data.nom_contact;
				$scope.messages_list = data.messages_list;
				checkNewMsg();
			}).
			error(function(){
				$scope.hiddenMessage = false;
				$scope.errorMessage = "Objet ou personne introuvable";
				$timeout(function(){
					$location.path("/");
					$location.replace();
				},2500);
			});
			// l'url n'a pas exactement la même forme si c'est ma photo ou la photo d'un autre que j'affiche.
			$scope.getPicUrl = function(tag){
				if(tag == "me"){
					return("/users/pictures/my");
				}else{
					return("/users/pictures/"+$scope.contactId);
				}
			}
			$scope.clickSendMessage = function(){
				$scope.hiddenMessage = true;
				var postData ={};
				postData.message = $scope.newMessage;
				$http.post('/messages/'+$routeParams.itemId+'/'+$routeParams.contactId,postData).success(function(data) {
					var msg = {};
					msg.content = $scope.newMessage;
					msg.sender="me";
					msg.date = new Date().toISOString();
					$scope.messages_list.push(msg);
					$scope.newMessage="";
				}).error(function(data, status, headers) {
					$scope.hiddenMessage = false;
					$scope.errorMessage = "L'envoi du message a échoué"
				});
			}

		},true);
	}]).
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


