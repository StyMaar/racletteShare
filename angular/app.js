'use strict';


// Declare app level module which depends on filters, and services
angular.module('racletteShare', ['controllers']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/connexion', {templateUrl: 'angular/partials/connexion.html', controller: 'connexionCtrl'});
    $routeProvider.otherwise({redirectTo: '/'});
  }]);
