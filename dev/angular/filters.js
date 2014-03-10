'use strict';

/* Filters */

angular.module('Filtres', []).filter('date', function() {
  return function(input) {
    var d = new Date(input);
	return d.toLocaleString();
  };
}).filter('zeroIsNull', function() {
  return function(input) {
    if(input==0){
		return null;
	}else{
		return input;
	}
  };
});
