///////////////////////////////////////
// fonctions utilitaires

var uuid = require('node-uuid').v4;

var kutils = {};

kutils.notFound = function(res){
	res.send(404);
}

kutils.badRequest = function(res){
	res.send(400);
}

kutils.forbiden = function(res){
	res.send(401,"vous n'avez pas la permission d'accéder à cette interface");
}

kutils.error = function(res,err){
	res.send(500,err);
}
// fonction qui sert à évaluer les erreurs
// return true s'il n'y a pas d'erreur
// mais s'il y a une erreur, elle envoie une réponse http avec le bon code d'erreur et retourne false
kutils.checkError = function(err,res){
	if(err){
		console.log(err);
	}
	switch(err){
		case null :
		case "" :
		break;
		case "notFound" :
			kutils.notFound (res);
		break;
		case "badRequest":
			kutils.badRequest(res);
		break;
		case "forbiden":
			kutils.forbiden(res);
		break;
	default: //cas des erreurs SQL ou express par exemple
			//ici on traite certaines erreurs attendues
			/*if(err.){
				break;
			}*/
			kutils.error(res,err);
		break;
	}
	return !err;
}

kutils.ok = function(res){
	res.send(200);
}
kutils.created = function(res){
	res.send(201);
}

//retourne un uuid sous forme de string
kutils.uuid = function(){
	var buff = new Buffer(32);
	uuid(null,buff);
	return uuid.unparse(buff);
}

/* Pour contrôler les écritures en base :
on vérifie si une erreur est retournée par le SGBD,
puis, s'il n'y en a pas : vérifie que quelque chose a été écrit
si ce n'est pas le cas on retourne une erreur : "pas d'écriture dans la base de données"
*/
kutils.checkUpdateErr = function (err,results){
	if(!err && (!results || (results && results.affectedRows == 0))){
		err = "pas d'écriture dans la base de données";
	}
	return err;
}

module.exports = kutils;
