var express = require('express');
var mysql = require('mysql');
var pool  = mysql.createPool({
        host:'localhost',
        user:'root',
        password:'azerty',
        database:'raclette'
});
var uuid = require('node-uuid').v4;
var async = require('async');

var app = express();

//permet l'utilisation des sessions dans l'application
//TODO: utiliser Reddis ici pour permettre de faire du load balancing sans soucis.
// scr : http://blog.modulus.io/nodejs-and-express-sessions + l doc de connect sur les sessions pour la durée d'ouverture de la session
app.use(express.cookieParser());
app.use(express.session({secret:"1234poney", cookie:{path: '/', httpOnly: true, maxAge: 8640000000 }})); //la session reste ouverte pendant 100 jours par défaut
//end sessions

//pour accédr aux infos de la session : req.session.bob 

//pour lire le contenu d'une requête post ou PUT
app.use(express.bodyParser());


//pour les demandes de fichier statiques, sauf le index.html
app.use("/css", express.static(__dirname + '/css'));
app.use("/angular", express.static(__dirname + '/angular'));
app.use("/libs_js", express.static(__dirname + '/lib'));
app.use("/img", express.static(__dirname + '/img'));

///////////////////////////////////////
// fonctions utilitaires (elle partiront dans un module à part plus tard)
var utils = {};
utils.forbiden = function(req,res){
  res.send(401,"vous n'avez pas la permission d'accéder à cette interface");
}

utils.notFound = function(req,res){
  res.send(404) //,"page non trouvée"); //le "page non trouvée" n'est là que parce que express semble ne pas renvoyer de réponse si jamais on ne met pas de corps de réponse.
}

utils.error = function(req,res,err){
  if(!err.notFound){
    res.send(500,err);
  }
}

utils.ok = function(req,res){
  res.send(200)//,"ok"); //le Ok n'est là que parce que express semble ne pas renvoyer de réponse si jamais on ne met pas de corps de réponse.
}

//retourne un uuid sous forme de string
utils.uuid = function(){
  var buff = new Buffer(32);
  uuid(null,buff);
  return uuid.unparse(buff);
}

/* vérifie si une erreur est retournée par le SGBD,
puis, s'il n'y en a pas : vérifie si tout c'est bien passé
  si ce n'est pas le cas on retourne une erreur : "pas d'écriture dans la base de données"
*/
utils.checkUpdateErr = function (err,results){
  if(!err && (!results || (results && results.affectedRows == 0))){
    err = "pas d'écriture dans la base de données";
  }
  return err;
}

////////////////////////////////////////

//traitement statique du index.html
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});


app.listen(process.argv[2]||7777); //si jamais un numéro de port est passé en paramètre à l'execution du script node, alors on utilisera ce port là, sinon on utilise le port 7777 par défaut
