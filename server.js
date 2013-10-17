var express = require('express');
var mysql = require('mysql');
var pool = mysql.createPool({
	host:'localhost',
	user:'root',
        password:'azerty',
	database:'raclette'
});
var uuid = require('node-uuid').v4;
var async = require('async');
var check = require('validator').check;

var app = express();

//permet l'utilisation des sessions dans l'application
//TODO: utiliser Reddis ici pour permettre de faire du load balancing sans soucis.
// scr : http://blog.modulus.io/nodejs-and-express-sessions + l doc de connect sur les sessions pour la durée d'ouverture de la session
app.use(express.cookieParser());
app.use(express.session({secret:"1234poney", cookie:{path: '/', httpOnly: true, maxAge: 8640000000 }})); //la session reste ouverte pendant 100 jours par défaut
// Rq : pour accédr aux infos de la session : req.session.bob 
//end sessions

//pour lire le contenu d'une requête post ou PUT
app.use(express.bodyParser());


//pour les demandes de fichier statiques, sauf le index.html
app.use("/css", express.static(__dirname + '/css'));
app.use("/angular", express.static(__dirname + '/angular'));
app.use("/libs_js", express.static(__dirname + '/libs_js'));
app.use("/img", express.static(__dirname + '/img'));

///////////////////////////////////////
// fonctions utilitaires (elle partiront dans un module à part plus tard)
var utils = {};

utils.notFound = function(res){
	res.send(404); 
}

utils.badRequest = function(res){
	res.send(400); 
}

utils.forbiden = function(res){
	res.send(401,"vous n'avez pas la permission d'accéder à cette interface");
}

utils.error = function(res,err){
	res.send(500,err); 
}
// fonction qui sert à évaluer les erreurs
// return true s'il n'y a pas d'erreur
// mais s'il y a une erreur, elle envoie une réponse http avec le bon code d'erreur et retourne false
utils.checkError = function(err,res){
	switch(err){
		case null :
		case "" :
		break;
		case "notFound" : 
			utils.notFound (res);
		break;
		case "badRequest":
			utils.badRequest(res);
		break;
		case "forbiden":
			utils.forbiden(res);
		break;
		default:
			utils.error(res,err);
		break;
	}
	return !err;
}

utils.ok = function(res){
	res.send(200);
}
utils.created = function(res){
	res.send(201);
}

//retourne un uuid sous forme de string
utils.uuid = function(){
	var buff = new Buffer(32);
	uuid(null,buff);
	return uuid.unparse(buff);
}

/* Pour contrôler les écritures en base : 
on vérifie si une erreur est retournée par le SGBD,
puis, s'il n'y en a pas : vérifie que quelque chose a été écrit 
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


//traitement des images de profil 
app.get('/users/pictures/my', function (req, res) {
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette image
		res.sendfile(__dirname + '/pictures/avatar2.png');
	}else{
		utils.forbiden(res);
	}
});

app.get('/users/pictures/:userId', function (req, res) {
	res.sendfile(__dirname + '/pictures/avatar1.png');
});

/*
	Connexion
*/
app.get("/users/:login/:password",function(req,res){
	var login = req.params.login;
	var password = req.params.password;
	try {
		check(login).len(6, 64).isEmail();
		check(password).len(3,64);
	} catch (e){
		utils.badRequest(res);
		return;
	}
	//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
	async.parallel([doLogin(login,password)],function(err,result){
		if(utils.checkError(err,res)){
			req.session.user_id=result[0];
			utils.ok(res);				
		}
	});
});

function doLogin(login, password){
	return function(callback){ 
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'un connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('SELECT id FROM user WHERE login = ? AND password = SHA2(?, 224)', [login,password], function(err, rows) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				var id = null;
				if(!err){
					if(rows && rows.length != 0){
							id = rows[0].id;
					}else{
						err = "forbiden";
					}
				}
				callback(err,id);
			});
		});
	}
}

/*
	Inscription
*/

app.post("/users",function(req,res){
	//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
	try {
		check(req.body.login).len(6, 64).isEmail();
		check(req.body.name).len(3,64);
		check(req.body.password).len(3,64);
		if(req.body.city){ //si une ville est renseignée, on s'assure que c'est bien une ville
			check(req.body.city).len(2,64);
		}
		if(req.body.tel){//si un numéro de tel est renseigné, on s'assure que c'est bien un numéro de tel
			check(req.body.tel).regex(/^[0-9\- .+]{10,17}$/);	
		}
	} catch (e){
		utils.badRequest(res);
		return;
	}
	async.parallel([createUser(req.body)],function(err,results){
		if(utils.checkError(err,res)){
			req.session.user_id=results[0];
			utils.created(res);
		}
	});
});

function createUser(user){
	var id = utils.uuid();
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'un connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('INSERT INTO user (id, login, name, password ,city, tel) \
			VALUES (?,?,?,SHA2(?, 224),?,?)', [id, user.login, user.name, user.password, user.city, user.tel], function(err, results) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				err = utils.checkUpdateErr(err,results);
				callback(err,id);
			});
		});
	}
}

/*
	Dashboard
*/

app.get("/users/my",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
		async.parallel([getUserInfo(req.session.user_id)],function(err,results){
			if(utils.checkError(err,res)){
				res.contentType('application/json');
				res.send(JSON.stringify(results[0])); 
			}
		});
	}else{
		utils.forbiden(res);
	}
});

/*
  getUserInfo : récupère les informations de base sur un utilisateur, elle est utilisée un grand nombre de fois, pas seulement pour le dashboard
  fonction faite pour être appelée avec async
*/

function getUserInfo(userId){
	return function(callback){ 
		pool.getConnection(function(err,connection){
			connection.query('SELECT name, id, city FROM user WHERE id=?', [userId], function(err, rows) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				var userData = null;
				if(!err){
					if(rows && rows.length!=0){
						userData = rows[0];
					}else{
						err = "notFound";         
					}
				}
				callback(err,userData);
			});
		});
	}
}


app.get("/deconnexion",function(req,res){
	if(req.session.user_id){
		req.session.user_id=null;
		utils.ok(res);
	}else{
		utils.forbiden(res);
	}
});


var usedPort = process.argv[2]||7777; //si jamais un numéro de port est passé en paramètre à l'execution du script node, alors on utilisera ce port là, sinon on utilise le port 7777 par défaut
app.listen(usedPort);
console.log("Serveur à l'écoute sur le port "+usedPort);
