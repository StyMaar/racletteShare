'use strict';

/* Controllers */

angular.module('controllers').
	controller('nouvel_objetCtrl', ['$scope','$http','$location','$window','LoginManager','NotifManager','formValidation','CategoryManager', function($scope, $http, $location, $window, LoginManager, NotifManager, formValidation, CategoryManager) {
		$scope.hiddenMessage = true;
		$scope.errorMessages = [];
		$scope.hiddenWarning = true;
		$scope.warningMessage = "";
		$scope.hidePic = true;
		LoginManager.checkEmail(function(){
			var isItOk = true;
			CategoryManager.getCatList(function(catList) {
				$scope.categories = catList;
			});
			NotifManager($scope);
			$scope.file = null;
			$scope.nom_objet="";
			$scope.category={};
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
					$scope.errorMessages.push("le nom de l'objet dois être compris entre 3 et 64 caractères de long.");
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
						category:$scope.category.id,
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

	}]);