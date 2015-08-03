'use strict';

angular.module('racletteModules')
	.factory('formValidation',function(){
		var fV = {};
		var mailReg = /[^@]*@[^@]*\.[a-zA-Z]{2,4}$/;
		var lengthReg = /.{3,64}/; // plus rapide qu'avec un String.length c.f. http://jsperf.com/regex-vs-string-length
		var telReg = /^[0-9\- .+]{10,17}$/;
		var descrLengthReg = /.{0,255}/;
		fV.checkEmail = function(email){
			return mailReg.test(email);
		}
		fV.checkLength = function(string){
			return string && lengthReg.test(string); // pour une raison mystérieuse, cette regex appliquée à null renvoyait true ...
		}
		fV.checkdescLength = function(string){
			return descrLengthReg.test(string);
		}
		fV.checkTel = function(tel){
			return telReg.test(tel);
		}
		return fV;
	});
