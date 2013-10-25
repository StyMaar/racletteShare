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

var app = express();

//permet l'utilisation des sessions dans l'application
//TODO: utiliser Reddis ici pour permettre de faire du load balancing sans soucis.
// scr : http://blog.modulus.io/nodejs-and-express-sessions + l doc de connect sur les sessions pour la durée d'ouverture de la session
app.use(express.cookieParser());
app.use(express.session({secret:"1234poney", cookie:{path: '/', httpOnly: true, maxAge: 8640000000 }})); //la session reste ouverte pendant 100 jours par défaut
// Rq : pour accédr aux infos de la session : req.session.bob 
//end sessions

//pour lire le contenu d'une requête post ou PUT
app.use(express.bodyParser({
	uploadDir:__dirname+"/pictures",
	keepExtensions:true
})); // TODO utiliser  => express.json() à la place, et formidable juste pour le transfert de fichier quand j'en ai vraiment besoin /!\ Sinon, ça active formidable, qui va autoriser bêtement tout transfert de fichier sur le serveur quelque soit l'url qui lui est passé ... Du crackage total !!!


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
		res.sendfile(__dirname + '/pictures/'+req.params.itemId+'.png');
	}catch(e){
		console.log(e);
		res.sendfile(__dirname + '/pictures/pot.png');
	}
});

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
==================================================*/

app.post("/items",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		try {
			var photo = req.files.photo;
			//ça ne sert à rien d'un point de vue sécurité puisque la sauvegarde a lieu quoi qu'il arrive mais bon ... 
			check(photo.size).isInt();
			check(photo.path).notNull();
			if(photo.size>5000000){ throw new Exception()};
			check(photo.headers['content-type']).is(/^image\/png/);
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
				var itemPath = __dirname + '/pictures/' + id + extension;
				fs.rename(photo.path, itemPath, function (err) {
					if(kutils.checkError(err,res)){
						console.log('renamed complete :'+ itemPath);
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
	Edit objets
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
	async.parallel([getItem(itemId)],function(err,results){
		if(kutils.checkError(err,res)){
			var itemDetails = results[0];
			res.contentType('application/json');
			res.send(JSON.stringify(itemDetails));
		}
	});
});

function getItem(itemId){
	return function(callback){
		pool.getConnection(function(err,connection){
			//on s'assure que l'appel d'une connection dans le pool se passe bien.
			if(err){
				callback(err);
				return;
			}
			connection.query('SELECT name, description, category FROM item WHERE id= ?', [itemId], function(err, rows) {
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

/*
	Recherche par catégorie
*/
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

/////////////////////////////////////////////////////////////////////////

var usedPort = process.argv[2]||7777; //si jamais un numéro de port est passé en paramètre à l'execution du script node, alors on utilisera ce port là, sinon on utilise le port 7777 par défaut
app.listen(usedPort);
console.log("Serveur à l'écoute sur le port "+usedPort);

