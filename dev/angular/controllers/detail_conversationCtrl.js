'use strict';

/* Controllers */

angular.module('controllers', ['racletteModules']).
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
	}]);
