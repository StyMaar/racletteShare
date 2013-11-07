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
var fs = require('fs');

var EventEmitter = require('events').EventEmitter;

var RedisStore = require("connect-redis")(express);
var redis = require("redis").createClient();

var imagemagick = require('imagemagick');

var app = express();

//permet l'utilisation des sessions dans l'application
//TODO: utiliser Reddis ici pour permettre de faire du load balancing sans soucis.
// scr : http://blog.modulus.io/nodejs-and-express-sessions + l doc de connect sur les sessions pour la durée d'ouverture de la session
// + http://stackoverflow.com/questions/14014446/how-to-save-and-retrieve-session-from-redis
app.use(express.cookieParser());
app.use(express.session({
	secret:"azerty",
	cookie:{
		path: '/', 
		httpOnly: true, 
		maxAge: 8640000000 
	},
	store: new RedisStore({
		host: 'localhost',
		port: 6379, 
		client: redis
	})
})); //la session reste ouverte pendant 100 jours par défaut

// Rq : pour accédr aux infos de la session : req.session.bob 
//end sessions

//pour lire le contenu d'une requête post ou PUT
app.use(express.bodyParser({
	uploadDir:__dirname+"/pictures"
})); // TODO utiliser  => express.json() à la place, et formidable juste pour le transfert de fichier quand j'en ai vraiment besoin /!\ Sinon, ça active formidable, qui va autoriser bêtement tout transfert de fichier sur le serveur quelque soit l'url qui lui est passé ... Du crackage total !!! Les mecs de connect s'en sont apperçu et du coup ils vont virer cette features : il faudra faire du formmidable à la main quand on en a besoin à partir de connect 3.0


//pour les demandes de fichier statiques, sauf le index.html
app.use("/css", express.static(__dirname + '/css'));
app.use("/angular", express.static(__dirname + '/angular'));
app.use("/libs_js", express.static(__dirname + '/libs_js'));
app.use("/img", express.static(__dirname + '/img'));

///////////////////////////////////////
// fonctions utilitaires (elle partiront dans un module à part plus tard)
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
		default:
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
		kutils.forbiden(res);
	}
});

app.get('/users/pictures/:userId', function (req, res) {
	res.sendfile(__dirname + '/pictures/avatar1.png');
});

//traitement des images des objets 
app.get('/items/pictures/:itemId', function (req, res) {
	try {
		check(req.params.itemId).isUUIDv4();
	} catch (e){
		kutils.badRequest(res);
		return;
	}
	try{
		res.sendfile(getPicturePathFromId(req.params.itemId));
	}catch(e){
		console.log(e);
		res.sendfile(__dirname + '/pictures/pot.png');
	}
});

//traitement des miniatures des objets 
app.get('/items/minipic/:itemId', function (req, res) {
	try {
		check(req.params.itemId).isUUIDv4();
	} catch (e){
		kutils.badRequest(res);
		return;
	}
	try{
		res.sendfile(getMiniPicPathFromId(req.params.itemId));
	}catch(e){
		console.log(e);
		res.sendfile(__dirname + '/pictures/pot.png');
	}
});

function getPicturePathFromId(itemId){
	return __dirname + '/pictures/big/'+itemId+'.jpg'
};

function getMiniPicPathFromId(itemId){
	return __dirname + '/pictures/mini/'+itemId+'.jpg'
}

/*
app.get('/items/pictures/:itemId', function (req, res) {
	try {
		check(req.params.itemId).isUUIDv4();
	} catch (e){
		kutils.badRequest(res);
		return;
	}
	async.parallel([getItemPictures(req.params.itemId)],function(err,result){
		if(kutils.checkError(err,res)){
			var path = result[0];
			if(path){
				res.sendfile(path);	
			}else{
				res.sendfile(__dirname + '/pictures/pot.png');
			}					
		}
	});
});

function getItemPictures(itemId){
	return function(callback){ 
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('SELECT picturePath FROM item WHERE id =?', [itemId], function(err, rows) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				var path = null;
				if(!err){
					if(rows && rows.length != 0){
							path = rows[0].picturePath;
					}else{
						err = "notFound";
					}
				}	
				callback(err,path);
			});
		});
	}
}*/


/*=========================================================
	Connexion
===========================================================*/

app.get("/checkLogin",function(req,res){		
	if(req.session.user_id){
		kutils.ok(res);
	}else{
		kutils.forbiden(res);
	}
});


app.get("/users/:login/:password",function(req,res){
	var login = req.params.login;
	var password = req.params.password;
	try {
		check(login).len(6, 64).isEmail();
		check(password).len(3,64);
	} catch (e){
		kutils.badRequest(res);
		return;
	}
	//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
	async.parallel([doLogin(login,password)],function(err,result){
		if(kutils.checkError(err,res)){
			req.session.user_id=result[0];
			kutils.ok(res);				
		}
	});
});

function doLogin(login, password){
	return function(callback){ 
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
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

/*================================================
	Inscription
=================================================*/

app.post("/users",function(req,res){
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
		kutils.badRequest(res);
		return;
	}
	//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
	async.parallel([createUser(req.body)],function(err,results){
		if(kutils.checkError(err,res)){
			req.session.user_id=results[0];
			kutils.created(res);
		}
	});
});

function createUser(user){
	var id = kutils.uuid();
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('INSERT INTO user (id, login, name, password ,city, tel) \
			VALUES (?,?,?,SHA2(?, 224),?,?)', [id, user.login, user.name, user.password, user.city, user.tel], function(err, results) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				err = kutils.checkUpdateErr(err,results);
				callback(err,id);
			});
		});
	}
}

/* ==================================================
	Dashboard
====================================================*/

app.get("/users/my",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
		async.parallel([getUserInfo(req.session.user_id)],function(err,results){
			if(kutils.checkError(err,res)){
				res.contentType('application/json');
				res.send(JSON.stringify(results[0])); 
			}
		});
	}else{
		kutils.forbiden(res);
	}
});

/*
  getUserInfo : récupère les informations de base sur un utilisateur, elle est utilisée un grand nombre de fois, pas seulement pour le dashboard
  fonction faite pour être appelée avec async
*/

function getUserInfo(userId){
	return function(callback){ 
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('SELECT name, id, city FROM user WHERE id = ?', [userId], function(err, rows) {
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
		kutils.ok(res);
	}else{
		kutils.forbiden(res);
	}
});

app.get("/categories",function(req,res){
	async.parallel([getCategories()],function(err,results){
		if(kutils.checkError(err,res)){
			res.contentType('application/json');
			var categories = [];
			if(results[0]){ //transforme une liste de {label:"Cuisine"} en une liste ["Cuisine","Sport" ...
				results[0].map(function(a){
					categories.push(a.label);
				});
			}
			res.send(JSON.stringify(categories)); 
		}
	}); 
});

function getCategories(){
	return function(callback){ 
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('SELECT label FROM category', [], function(err, rows) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				callback(err,rows);
			});
		});
		//callback(null,[{label:"Couture"}]);
	}
}

/*================================================
	Mes objets
==================================================*/

app.get("/items/my",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
		async.parallel([getItemList(req.session.user_id)],function(err,results){
			if(kutils.checkError(err,res)){
				var itemsList = results[0];
				res.contentType('application/json');
				res.send(JSON.stringify(itemsList));
			}
		});
	}else{
		kutils.forbiden(res);
	}
});

/*
  getItemList : récupère la liste des objets appartenant à l'utilisateur dont l'id vaut : userId
  cette fonction retourne une fonction qui peut être utilisée par async pour paralléliser les tâches : 
    i.e. une fonction prenant un seul paramètre qui est une fonction "callback".

    Toutes les fonctions d'accès à la base de donnée seront de cette forme là, celà permettra de pouvoir les paralléliser sans peine
*/

function getItemList(userId){
	return function(callback){ 
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('SELECT name, id FROM item WHERE user_id=?', [userId], function(err, rows) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				callback(err,rows);
			});
		});
	}
}

app.delete("/items/detail/:itemId",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		var itemId = req.params.itemId;	
		try{		
			check(itemId).isUUIDv4() ;
		} catch (e){
			kutils.badRequest(res);
			return;
		}		
		//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
		async.parallel([deleteItem(req.session.user_id, itemId)],function(err,results){
			if(kutils.checkError(err,res)){
				kutils.ok(res);
				deleteFile(getPicturePathFromId(itemId));
				deleteFile(getMiniPicPathFromId(itemId));
			}
		});
	}else{
		kutils.forbiden(res);
	}
});


/*
  deleteItem : fonction assurant la suppression d'un objet dans la base de donnée pour peu qu'on ai les droits sur cet objet.
*/

function deleteItem(userId, itemId){
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('DELETE FROM item WHERE user_id = ? AND id = ?', [userId, itemId] , function(err, results) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				err = kutils.checkUpdateErr(err,results);
				callback(err);
			});
		});
	}
}


/*================================================
	Nouvel objet
	TODO : Pour l'instant, je fais d'abord l'inscription en base puis les opérations sur les photos, ce n'ets absolument pas optimal ni cas cas de perf ni en cas d'erreur survenant au milieu de l'opération, mais pour l'instant c'est comme ça.
==================================================*/

app.post("/items",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		try {
			var photo = req.files.photo;
			//ça ne sert à rien d'un point de vue sécurité puisque la sauvegarde a lieu quoi qu'il arrive mais bon ... 
			check(photo.size).isInt();
			check(photo.path).notNull();
			if(photo.size>5000000){ throw new Exception()};
			check(photo.headers['content-type']).is(/^image\.*/);
			check(req.body.nom_objet).len(3,64);
			if(req.body.description){ //si une description est renseignée, on s'assure que c'est bien une description
				check(req.body.description).len(0,255);
			}
		} catch (e){
			if(photo && photo.path){
				deleteFile(photo.path);
			}
			kutils.badRequest(res);
			return;
		}
		var exReg = /.*(\.[a-z]*)$/; //regex pour trouver l'extension du fichier
		var extension = photo.path.replace(exReg,"$1");

		//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
		async.parallel([newItem(req.session.user_id, req.body)],function(err,results){
			if(kutils.checkError(err,res)){
				var id = results[0];
				savePictures(photo.path, id, function (err) {
					if(kutils.checkError(err,res)){
						kutils.ok(res);
					}
				});
			}else{
				deleteFile(photo.path);
			}
		});
	}else{
		kutils.forbiden(res);
	}
});

function savePictures(uploadPath,itemId,callback){
	var itemPicPath = getPicturePathFromId(itemId);
	var itemMiniPicPath = getMiniPicPathFromId(itemId);
	var bigX=320;
	var bigY=380;
	var miniX =75;
	var miniY =75;
	
	var bigDimensions = bigX+"x"+bigY;
	var miniDimensions = miniX+"x"+miniY;
	
	async.parallel([
		function(async_callback){
			imagemagick.convert([uploadPath,'-resize', bigDimensions, itemPicPath], function(err, stdout){
				console.log("grosse image crée pour l'item :"+itemId);
				async_callback(err);
			});
		},
		function(async_callback){
			imagemagick.convert([uploadPath,'-resize', miniDimensions, itemMiniPicPath], function(err, stdout){
				console.log("mini image crée pour l'item :"+itemId);
				async_callback(err);
			});
		}
	],
	function(err, results) {
		deleteFile(uploadPath);
		callback(err);
	});
}

function deleteFile(path){
	fs.unlink(path, function (err) {
		if (err){
			console.log(err);
			console.log('impossible de supprimer '+ path);
		}else{
			console.log('successfully deleted '+ path);		
		}				
	});
}


/*
  newItem : prend les infos correspondant au nouvel objet
  et créé cet objet dans la base
*/

function newItem(userId, item){
	var id = kutils.uuid();
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('INSERT INTO item (id, user_id, name, description, category) \
			VALUES (?,?,?,?,?)', [id, userId, item.nom_objet, item.description, item.category], function(err, results) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				err = kutils.checkUpdateErr(err,results);		
				callback(err,id);
			});
		});
	}
}

/*================================================
	Edit objet
==================================================*/
app.get("/items/my/detail/:itemId",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		var itemId = req.params.itemId;	
		try{		
			check(itemId).isUUIDv4() ;
		} catch (e){
			kutils.badRequest(res);
			return;
		}
		//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
		async.parallel([getMyItem(itemId, req.session.user_id)],function(err,results){
			if(kutils.checkError(err,res)){
				var itemDetails = results[0];
				res.contentType('application/json');
				res.send(JSON.stringify(itemDetails));
			}
		});
	}else{
		kutils.forbiden(res);
	}
});

function getMyItem(itemId, userId){
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('SELECT name, description, category FROM item WHERE id= ? AND user_id = ?', [itemId, userId], function(err, rows) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				var itemDetails = null;
				if(!err){
					if(rows && rows.length!=0){
						itemDetails = rows[0];
					}else{
						err = "notFound";
					}
				}
				callback(err,itemDetails);
			});
		});
	}
}

app.put("/items/detail/:itemId",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		var itemId=req.params.itemId;
		try {
			check(itemId).isUUIDv4();
			check(req.body.nom_objet).len(3,64);
			if(req.body.description){ //si une description est renseignée, on s'assure que c'est bien une description
				check(req.body.description).len(0,255);
			}
		} catch (e){
			kutils.badRequest(res);
			return;
		}
		//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
		async.parallel([editItem(req.session.user_id, req.body, itemId)],function(err,results){
			if(kutils.checkError(err,res)){
				kutils.ok(res);
			}
		});
	}else{
		kutils.forbiden(res);
	}
});

function editItem(userId, item, itemId){
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('UPDATE `item` SET `name`=?,`description`=?,`category`=? WHERE id=? AND user_id = ?', [item.nom_objet, item.description, item.category, itemId, userId], function(err, results) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				err = kutils.checkUpdateErr(err,results);		
				callback(err);
			});
		});
	}
}
/*================================================
	recherche_categorie
==================================================*/

app.get("/items/category/:category",function(req,res){
	var category = req.params.category;	
	try{		
		
	} catch (e){
		kutils.badRequest(res);
		return;
	}
	//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
	async.parallel([getItemByCategory(category)],function(err,results){
		if(kutils.checkError(err,res)){
			var itemList = results[0];
			res.contentType('application/json');
			res.send(JSON.stringify(itemList));
		}
	});
});

function getItemByCategory(category){
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('SELECT item.id as id, user.name as ownerName, item.name as name FROM item INNER JOIN user ON item.user_id=user.id WHERE item.category= ?', [category], function(err, rows) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				if(!err){
					if(!rows || rows.length==0){
						err = "notFound";
					}
				}
				callback(err,rows);
			});
		});
	}
}

/*================================================
	recherche_nom
==================================================*/

app.get("/items/keyword/:keyword",function(req,res){
	var keyword = req.params.keyword;	
	try{		
		
	} catch (e){
		kutils.badRequest(res);
		return;
	}
	//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
	async.parallel([getItemByName(keyword)],function(err,results){
		if(kutils.checkError(err,res)){
			var itemList = results[0];
			res.contentType('application/json');
			res.send(JSON.stringify(itemList));
		}
	});
});

function getItemByName(keyword){
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('SELECT item.id as id, user.name as ownerName, item.name as name FROM item INNER JOIN user ON item.user_id=user.id WHERE MATCH (item.name,item.description) AGAINST (?)', [keyword], function(err, rows) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				if(!err){
					if(!rows || rows.length==0){
						err = "notFound";
					}
				}
				callback(err,rows);
			});
		});
	}
}

/*================================================
	Detail_objet
==================================================*/
app.get("/items/detail/:itemId",function(req,res){
	var itemId = req.params.itemId;	
	try{		
		check(itemId).isUUIDv4() ;
	} catch (e){
		kutils.badRequest(res);
		return;
	}
	//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
	async.parallel([getItemDetail(itemId,req.session.user_id)],function(err,results){
		if(kutils.checkError(err,res)){
			var itemDetails = results[0];
			res.contentType('application/json');
			res.send(JSON.stringify(itemDetails));
		}
	});
});

//ici le userId est là a titre informatif, on indiquera d'une façon spéciale dans la liste les objets qui m'appartiennent.
function getItemDetail(itemId,userId){
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query("SELECT if( item.user_id = ?, 'mine', '' ) as isMine, item.name as name, item.description as description, item.category as category, user.name as ownerName, item.user_id as ownerId FROM item INNER JOIN user ON item.user_id=user.id WHERE item.id= ?", [userId, itemId], function(err, rows) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				var itemDetails = null;
				if(!err){
					if(rows && rows.length!=0){
						itemDetails = rows[0];
					}else{
						err = "notFound";
					}
				}
				callback(err,itemDetails);
			});
		});
	}
}

/*================================================
	Detail_conversation
==================================================*/
app.get("/messages/:itemId/:contactId",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		var itemId = req.params.itemId;
		var contactId = req.params.contactId;
		try{		
			check(itemId).isUUIDv4();
			check(contactId).isUUIDv4();
		} catch (e){
			kutils.badRequest(res);
			return;
		}
		//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
		async.parallel([getConversationDetail(itemId,contactId), getMessagesList(itemId,contactId,req.session.user_id)],function(err,results){
			if(kutils.checkError(err,res)){
				var convDetails = results[0];
				markAsRead(req.session.user_id,contactId,itemId);
				convDetails.messages_list= results[1];
				res.contentType('application/json');
				res.send(JSON.stringify(convDetails));
			}
		});
	}else{
		kutils.forbiden(res);
	}
});

function getConversationDetail(itemId,contactId){
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query("SELECT * \
				FROM (\
					SELECT name AS nom_contact\
					FROM user\
					WHERE id = ?\
				)A, (\
					SELECT name AS nom_objet\
					FROM item\
					WHERE id = ?\
				)B", [contactId,itemId], function(err, rows) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				var convDetails = null;
				if(!err){
					if(rows && rows.length!=0){
						convDetails = rows[0];
					}else{
						err = "notFound";
					}
				}
				callback(err,convDetails);
			});
		});
	}
}

function getMessagesList(itemId,contactId,myId){
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query("SELECT message.date, \
								message.content, \
								IF(message.sender_id = ?,'me','other') AS sender \
							FROM \
								message \
							WHERE message.item_id = ? \
								AND ( \
								(message.sender_id = ? AND message.receiver_id = ?) OR (message.sender_id = ? AND message.receiver_id = ?) \
								) \
							ORDER BY message.date; ", [myId,itemId,myId,contactId,contactId,myId], function(err, rows) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				var msgList = rows;
				callback(err,msgList);
			});
		});
	}
}

app.post("/messages/:itemId/:contactId",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		var contactId = req.params.contactId;
		var itemId = req.params.itemId;
		try{		
			check(itemId).isUUIDv4();
			check(contactId).isUUIDv4();
		} catch (e){
			kutils.badRequest(res);
			return;
		}
		//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
		async.parallel([newMessage(itemId, req.session.user_id, contactId, req.body.message)],function(err,results){
			if(kutils.checkError(err,res)){
				var eventString = contactId+req.session.user_id+itemId;
				var msg = {
					sender:'other',
					content:req.body.message,
					date:(new Date()).toISOString()
				};
				
				if(notifier.listeners(eventString).length != 0){ //si le contact est en ligne avec nous, on lui envoie directement la réponse
					notifier.emit(eventString,msg);
				}else if(notifier.listeners(contactId).length != 0){ //si il est connecté mais pas en train de parler avec nous, on lui envoie une notification et on ajoute ça a la liste des messages non-lus
					var notif = {
						type:"message",
						contact:req.session.user_id
					}
					addToUnread(contactId,req.session.user_id,itemId);
					notifier.emit(contactId,notif);
				}else{ //sinon on ajoute juste ça à la liste de ces messages non lu
					addToUnread(contactId,req.session.user_id,itemId);
				}
				kutils.ok(res);
			}
		});
	}else{
		kutils.forbiden(res);
	}
});


function newMessage(itemId, myId, contactId, message){
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query("INSERT INTO message (item_id, sender_id, content, date, receiver_id ) \
SELECT ?, ?, ?, NOW(), ? FROM item WHERE id = ? AND (user_id = ? OR user_id = ?)", [itemId, myId, message, contactId, itemId, myId, contactId] , function(err, results) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				err = kutils.checkUpdateErr(err,results);
				callback(err);
			});
		});
	}
}

/*================================================
	Mes_conversations
==================================================*/

app.get("/messages/conversations",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		var myId = req.session.user_id;
		//ici l'utilisation de async n'est pas indispensable, mais par soucis de cohérence de l'ensemble je l'utilise quand même
		async.parallel([getConversationsList(myId)],function(err,results){
			var convList = !err?results[0]:null;
			listUnread(err,myId,convList,function(err,cL){
				if(kutils.checkError(err,res)){
					res.contentType('application/json');
					res.send(JSON.stringify(cL));
				}
			});
			
		});
	}else{
		kutils.forbiden(res);
	}
});

function getConversationsList(myId){
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query("SELECT DISTINCT user.id AS contact_id, user.name AS contact_name, item.id AS item_id, item.name AS item_name \
							FROM (\
								SELECT item_id, IF( message.sender_id = ?, message.receiver_id, IF( message.receiver_id = ?, message.sender_id, NULL ) ) AS contact_id \
								FROM message \
							)A \
							INNER JOIN user ON A.contact_id = user.id\
							INNER JOIN item ON A.item_id = item.id", [myId,myId], function(err, rows) {
				connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
				var convList = rows;
				callback(err,convList);
			});
		});
	}
}

/////  Notifications des messages

var notifier = new EventEmitter();

function longPollResponse(res){
	//une closure pour concerver la reponse http
	return function (msg){
		try {
			res.contentType('application/json');
			res.emit('kend'); //lorsque la connexion a retournée un resultat, on supprime aussi l'abonnement
			res.send(JSON.stringify(msg));
		}catch(e){
			console.log(e);
		}
	}
}

app.get("/waitMessage/:itemId/:contactId",function(req,res){
	if(req.session.user_id){
		var myId = req.session.user_id;
		var contactId = req.params.contactId;
		var itemId = req.params.itemId;
		try{		
			check(itemId).isUUIDv4();
			check(contactId).isUUIDv4();
		} catch (e){
			kutils.badRequest(res);
			return;
		}
		var eventString = myId+contactId+itemId; // string caractérisant la conversation
		var evtCb = longPollResponse(res);

		notifier.on(eventString, evtCb); //on s'abonne aux notifications concernant cette conversation

		function rmListener(){
			notifier.removeListener(eventString, evtCb);	
		}
		res.on('close',rmListener); //lorsque la connexion est rompue, on supprime l'abonnement.
		res.on('kend',rmListener); //lorsque la connexion a retournée un resultat, on supprime aussi l'abonnement
	}else{
		kutils.forbiden(res);
	}
});

app.get("/notifs",function(req,res){
	if(req.session.user_id){
		var myId = req.session.user_id;
		var eventString = myId;
		var evtCb = longPollResponse(res);
		
		notifier.on(eventString, evtCb); //on s'abonne aux notifications concernant mon identifiant
		function rmListener(){
			notifier.removeListener(eventString, evtCb);	
		}
		res.on('close',rmListener); //lorsque la connexion est rompue, on supprime l'abonnement.
		res.on('kend',rmListener); //lorsque la connexion a retournée un resultat, on supprime aussi l'abonnement
	}else{
		kutils.forbiden(res);
	}
});

/* 

Gestion des messages non-lus : 
les messages non lus sont stocké dans redis en 3 parties :
"message" + monId => nombre de messages non lus;
monId => [liste,des,conversations,qui,ont,du,nouveau];
monId:contactId:itemId => nombre de messages nons lus provenant de la conversation en question.

sur le dashboard et n'importe quelle page : affiche le nombre de messages non lus
sur la page mes_conversation : pour chacune des conversations de la liste de conversation, on affiche le nombre de messages non lus
quand on va sur la page de la conversation, ça reset le nombre de message de la conversation en question + retire l'id de la conversation de la liste des conversations actives + diminue le nombre total de message non-lus d'autant.

*/

function errCB(p){
	return function(err){
		if(err){
			console.log(p);
			console.log(err);
		}
	}
}

function addToUnread(destinataire,expediteur,itemId){
	redis.incr("message"+destinataire,function(){
		console.log("add a new unread message to :"+destinataire);
	});
	redis.sadd(destinataire, destinataire+":"+expediteur+":"+itemId,errCB('sadd destinataire'));
	redis.incr(destinataire+":"+expediteur+":"+itemId,errCB("incr des:exp:item"));
}

function markAsRead(destinataire,expediteur,itemId){
	redis.get(destinataire+":"+expediteur+":"+itemId,function(err,n){
		redis.set(destinataire+":"+expediteur+":"+itemId,0,errCB("set des:exp:item 0"));
		redis.decrby("message"+destinataire,n,errCB("decrcr message+des "+n));
	});
	redis.srem(destinataire, destinataire+":"+expediteur+":"+itemId,errCB("srem destinataire"));
}

//récupère la liste des conversations actives avec leur nombre de message associé, puis lorsque tout est récupéré, execute le callback
//le callback est une fonction qui prend une erreur et liste de conversation en paramètre
//TODO : async ça sert à ça aussi et c'est pas fait pour les chines, ça serait cool de l'utiliser pour avoir du code compréhenssible et cohérent ...
function listUnread(erreur,destinataire,convList,callback){
	if(erreur){
		callback(erreur,convList);
	}

	//l'eventEmitter "attendre" est là pour s'assurer que tous les appels à redis ont renvoyé leur resultat avant d'executer le callback
	var attendre = new EventEmitter();
	attendre.effectue = 0;
	attendre.callback = callback;
	attendre.total = convList.length;
	attendre.err = null;
	
	attendre.on("fini",function handler(err,convList){
		if(err){
			this.callback(err,convList);
			this.removeListener("fini",handler);
		}else{
			this.effectue++;
			if(this.effectue == this.total){
				this.callback(err,convList);
			}
		}
	});

	//on parcourt la liste de conversation et on regarde s'il y a des messages non lus parmis cette liste.
	for(var i =0;i<convList.length;i++){
		var conv = convList[i];
		redis.get(destinataire+":"+ conv.contact_id +":"+conv.item_id,function(err,n){
			conv.unread = n;
			attendre.emit("fini",err,convList);
		});
	}
}

app.get("/unread",function(req,res){
	if(req.session.user_id){
		var myId = req.session.user_id;
		redis.get("message"+myId,function(err,msg){
			if(kutils.checkError(err,res)){
				res.contentType('application/json');
				res.send(msg);
			}
		});
	}else{
		kutils.forbiden(res);
	}
});


/////////////////////////////////////////////////////////////////////////

var usedPort = process.argv[2]||7777; //si jamais un numéro de port est passé en paramètre à l'execution du script node, alors on utilisera ce port là, sinon on utilise le port 7777 par défaut
app.listen(usedPort);
console.log("Serveur à l'écoute sur le port "+usedPort);

