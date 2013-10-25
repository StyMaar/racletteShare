'use strict';


// Declare app level module which depends on filters, and services
angular.module('racletteShare', ['controllers']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/connexion', {templateUrl: 'angular/partials/connexion.html', controller: 'connexionCtrl'});
    $routeProvider.when('/inscription', {templateUrl: 'angular/partials/inscription.html', controller: 'inscriptionCtrl'});
    $routeProvider.when('/', {templateUrl: 'angular/partials/dashboard.html', controller: 'dashboardCtrl'});
    $routeProvider.when('/users/my', {templateUrl: 'angular/partials/mon_profil.html', controller: 'mon_profilCtrl'});
    $routeProvider.when('/items/my', {templateUrl: 'angular/partials/mes_objets.html', controller: 'mes_objetsCtrl'});
    $routeProvider.when('/nouvel_objet', {templateUrl: 'angular/partials/nouvel_objet.html', controller: 'nouvel_objetCtrl'});
    $routeProvider.otherwise({redirectTo: '/'});
  }]);
