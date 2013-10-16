'use strict';

angular.module('racletteModules', [])
	.factory('formValidation',['$window',function($window){
		var fV = {};
		var mailReg = /[^@]*@[^@]*\.[a-zA-Z]{2,4}$/;
		var lengthReg = /.{3,64}/; // plus rapide qu'avec un String.length c.f. http://jsperf.com/regex-vs-string-length
		var telReg = /^[0-9\- .+]{10,17}$/;
		fV.checkLogin = function(login){
			return mailReg.test(login);
		}
		fV.checkLength = function(string){
			return string && lengthReg.test(string);
		}
		fV.checkTel = function(tel){
			return telReg.test(tel);
		}
		return fV;
	}]);

