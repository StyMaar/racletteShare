'use strict';


// Declare app level module which depends on filters, and services
angular.module('racletteShare', ['controllers']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/connexion', {templateUrl: 'angular/partials/connexion.html', controller: 'connexionCtrl'});
    $routeProvider.when('/inscription', {templateUrl: 'angular/partials/inscription.html', controller: 'inscriptionCtrl'});
    $routeProvider.otherwise({redirectTo: '/'});
  }]);
