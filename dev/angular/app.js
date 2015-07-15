'use strict';


// Declare app level module which depends on filters, and services
angular.module('racletteShare', ['controllers','Filtres']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/connexion', {templateUrl: 'angular/templates/connexion.html', controller: 'connexionCtrl'});
    $routeProvider.when('/reset_password', {templateUrl: 'angular/templates/reset_password.html', controller: 'resetPasswordCtrl'});
    $routeProvider.when('/change_password', {templateUrl: 'angular/templates/change_password.html', controller: 'changePasswordCtrl'});
    $routeProvider.when('/inscription', {templateUrl: 'angular/templates/inscription.html', controller: 'inscriptionCtrl'});
    $routeProvider.when('/', {templateUrl: 'angular/templates/dashboard.html', controller: 'dashboardCtrl'});
    $routeProvider.when('/users/my', {templateUrl: 'angular/templates/mon_profil.html', controller: 'mon_profilCtrl'});
    $routeProvider.when('/items/my', {templateUrl: 'angular/templates/mes_objets.html', controller: 'mes_objetsCtrl'});
    $routeProvider.when('/nouvel_objet', {templateUrl: 'angular/templates/nouvel_objet.html', controller: 'nouvel_objetCtrl'});
    $routeProvider.when('/edit_objet/:itemId', {templateUrl: 'angular/templates/edit_objet.html', controller: 'edit_objetCtrl'});
    $routeProvider.when('/items/category/:category', {templateUrl: 'angular/templates/recherche_category.html', controller: 'recherche_categoryCtrl'});
    $routeProvider.when('/items/keyword/:keyword', {templateUrl: 'angular/templates/recherche_nom.html', controller: 'recherche_nomCtrl'});
    $routeProvider.when('/items/detail/:itemId', {templateUrl: 'angular/templates/detail_objet.html', controller: 'detail_objetCtrl'});
    $routeProvider.when('/messages/:itemId/:contactId', {templateUrl: 'angular/templates/detail_conversation.html', controller: 'detail_conversationCtrl'});
    $routeProvider.when('/messages/conversations', {templateUrl: 'angular/templates/mes_conversations.html', controller: 'mes_conversationsCtrl'});
    $routeProvider.otherwise({redirectTo: '/'});
  }]);
