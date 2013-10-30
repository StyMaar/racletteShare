'use strict';

/* Filters */

angular.module('Filtres', []).filter('date', function() {
  return function(input) {
    var d = new Date(input);
	return d.toLocaleString();
  };
});
