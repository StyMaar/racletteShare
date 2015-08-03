var express = require('express');
var check = require('validator').check;

var EventEmitter = require('events').EventEmitter;

var RedisStore = require("connect-redis")(express);
var redis = require("redis").createClient();

var mySQLparams = require('./mySQLparams');

var mysql = require('mysql');
var pool = mysql.createPool(mySQLparams);


var services = require('./services');
var kutils = require('./kutils');

var sendMail = require('./sendMail');

var app = express();

//permet l'utilisation des sessions dans l'application
//On utilise Reddis ici pour permettre de faire du load balancing sans soucis, mais aussi pour pouvoir redémarrer l'application sans que ça supprime la session des utilisateurs enregistrés.
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

app.use(express.bodyParser({
	uploadDir:__dirname+"/pictures"
})); // TODO utiliser  => express.json() à la place, et formidable juste pour le transfert de fichier quand j'en ai vraiment besoin /!\ Sinon, ça active formidable, qui va autoriser bêtement tout transfert de fichier sur le serveur quelque soit l'url qui lui est passé ... Du crackage total !!! Les mecs de connect s'en sont apperçu et du coup ils vont virer cette features : il faudra faire du formmidable à la main quand on en a besoin à partir de connect 3.0


//pour les demandes de fichier statiques, sauf le index.html
app.use("/css", express.static(__dirname + '/css'));
app.use("/angular", express.static(__dirname + '/angular'));
app.use("/libs_js", express.static(__dirname + '/libs_js'));
app.use("/img", express.static(__dirname + '/img'));


////////////////////////////////////////

//traitement statique du index.html
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});


//traitement des images de profil
app.get('/users/pictures/my', function (req, res) {
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette image
		res.sendfile(__dirname + '/pictures/avatar2.png');//TODO: utiliser des avatar générés de manière procédurale
	}else{
		kutils.forbiden(res);
	}
});

app.get('/users/pictures/:userId', function (req, res) {
	res.sendfile(__dirname + '/pictures/avatar1.png');//TODO: utiliser des avatar générés de manière procédurale
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
		res.sendfile(__dirname + '/pictures/pot.png');//TODO: trouver une image par défaut un peu plus utile
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
		res.sendfile(__dirname + '/pictures/pot.png');//TODO: trouver une image par défaut un peu plus utile
	}
});

function getPicturePathFromId(itemId){
	return __dirname + '/pictures/big/'+itemId+'.jpg';
}

function getMiniPicPathFromId(itemId){
	return __dirname + '/pictures/mini/'+itemId+'.jpg';
}


/*=========================================================
	Connexion
===========================================================*/

app.get("/checkEmail",function(req,res){
	if(req.session.user_id){
		kutils.ok(res);
	}else{
		kutils.forbiden(res);
	}
});


app.get("/users/:email/:password",function(req,res){
	var email = req.params.email;
	var password = req.params.password;
	try {
		check(email).len(6, 64).isEmail();
		check(password).len(3,64);
	} catch (e){
		kutils.badRequest(res);
		return;
	}
	pool.getConnection(services.doLogin(email,password,function(err,result,connection){
		if(kutils.checkError(err,res)){
			req.session.user_id=result;
			kutils.ok(res);
		}
		connection.release();
	}));
});

app.post("/users/changePassword",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page, parceque !
		var oldPassword = req.body.oldPassword;
		var newPassword = req.body.newPassword;
		var userId = req.session.user_id;
		try {
			check(oldPassword).len(3,64);
			check(newPassword).len(3,64);
		} catch (e){
			kutils.badRequest(res);
			return;
		}
		pool.getConnection(services.changePassword(userId, oldPassword, newPassword, function(err,connection){
			if(kutils.checkError(err,res)){
				kutils.ok(res);
			}
		}));
	}else{
		kutils.forbiden(res);
	}
});


app.get("/users/:email",function(req,res){
	var email = req.params.email;
	try {
		check(email).len(6, 64).isEmail();
	} catch (e){
		kutils.badRequest(res);
		return;
	}
	pool.getConnection(services.resetPassword(email, function(err, newPassword, connection){
		//TODO : il faudrait changer ça de manière à ne pas renvoyer d'erreur si jamais l'email n'existe pas. (sinon c'est aussi une possibilité d'attaque)
		if(kutils.checkError(err,res)){
			sendMail(email, newPassword);
			kutils.ok(res);
		}
		connection.release();
	}));
});

/*================================================
	Inscription
=================================================*/

app.post("/users",function(req,res){
	try {
		check(req.body.email).len(6, 64).isEmail();
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

	pool.getConnection(services.createUser(req.body,function(err,results,connection){
		//specific error handling for duplicate entries
		if(err && err.code && err.code === "ER_DUP_ENTRY"){
			kutils.error(res,"L'adresse email est déjà utilisée");
		}
		
		if(kutils.checkError(err,res)){
			req.session.user_id=results;
			kutils.created(res);
		}
		connection.release();
	}));
});

/* fonction déplacée : createUser */

/* ==================================================
	Dashboard
====================================================*/

app.get("/users/my",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page

		pool.getConnection(services.getUserInfo(req.session.user_id,function(err,results,connection){
			if(kutils.checkError(err,res)){
				res.contentType('application/json');
				res.send(JSON.stringify(results));
			}
			connection.release();
		}));
	}else{
		kutils.forbiden(res);
	}
});

/* fonction déplacée : getUserInfo*/

app.get("/deconnexion",function(req,res){
	if(req.session.user_id){
		req.session.user_id=null;
		kutils.ok(res);
	}else{
		kutils.forbiden(res);
	}
});

app.get("/categories",function(req,res){
	pool.getConnection(services.getCategories(function(err,results,connection){
		if(kutils.checkError(err,res)){
			res.contentType('application/json');
			res.send(JSON.stringify(results));
		}
		connection.release();
	}));
});
/* fonction déplacée : getCategories*/

/*================================================
	Mes objets
==================================================*/

app.get("/items/my",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page

		pool.getConnection(services.getItemList(req.session.user_id,function(err,results,connection){
			if(kutils.checkError(err,res)){
				var itemsList = results;
				res.contentType('application/json');
				res.send(JSON.stringify(itemsList));
			}
			connection.release();
		}));
	}else{
		kutils.forbiden(res);
	}
});
/* fonction déplacée :  getItemList*/

app.delete("/items/detail/:itemId",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		var itemId = req.params.itemId;
		try{
			check(itemId).isUUIDv4() ;
		} catch (e){
			kutils.badRequest(res);
			return;
		}

		pool.getConnection(services.deleteItem(req.session.user_id, itemId, function(err,results,connection){
			if(kutils.checkError(err,res)){
				kutils.ok(res);
				services.deleteFile(getPicturePathFromId(itemId));
				services.deleteFile(getMiniPicPathFromId(itemId));
			}
			connection.release();
		}));
	}else{
		kutils.forbiden(res);
	}
});
/* fonction déplacée : deleteItem */

/*================================================
	Nouvel objet
	TODO : Pour l'instant, je fais d'abord l'inscription en base puis les opérations sur les photos, ce n'ets absolument pas optimal ni cas cas de perf ni en cas d'erreur survenant au milieu de l'opération, mais pour l'instant c'est comme ça.
==================================================*/

app.post("/items",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		var photo;
		try {
			photo = req.files.photo;
			//ça ne sert à rien d'un point de vue sécurité puisque la sauvegarde a lieu quoi qu'il arrive mais bon ...
			check(photo.size).isInt();
			check(photo.path).notNull();
			if(photo.size>5000000){
				throw new Error();//le throw new exception n'est pas là pour lever une véritable exception qui remonte toute la stack, mais juste pour sortir du block try{}catch{} (parce que c'est le fonctionnement du plugin check)
			}
			check(photo.headers['content-type']).is(/^image\.*/);
			check(req.body.nom_objet).len(3,64);
			if(req.body.description){ //si une description est renseignée, on s'assure que c'est bien une description
				check(req.body.description).len(0,255);
			}
		} catch (e){
			if(photo && photo.path){
				services.deleteFile(photo.path);//on supprime le fichier du répertoire temporaire si il y a un problème.
			}
			kutils.badRequest(res);
			return;
		}
		var exReg = /.*(\.[a-z]*)$/; //regex pour trouver l'extension du fichier
		var extension = photo.path.replace(exReg,"$1");
		pool.getConnection(services.newItem(req.session.user_id, req.body,function(err,results,connection){
			if(kutils.checkError(err,res)){
				var id = results;
				services.savePictures(photo.path, id, getPicturePathFromId, getMiniPicPathFromId, function (err) {
					if(kutils.checkError(err,res)){
						kutils.ok(res);
					}
				});
			}else{
				services.deleteFile(photo.path);
			}
			connection.release();
		}));
	}else{
		kutils.forbiden(res);
	}
});
/* fonctions déplacées : savePictures, deleteFile, newItem */

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
		pool.getConnection(services.getMyItem(itemId, req.session.user_id,function(err,results,connection){
			if(kutils.checkError(err,res)){
				var itemDetails = results;
				res.contentType('application/json');
				res.send(JSON.stringify(itemDetails));
			}
			connection.release();
		}));
	}else{
		kutils.forbiden(res);
	}
});
/* fonction déplacée : getMyItem */

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
		pool.getConnection(services.editItem(req.session.user_id, req.body, itemId, function(err,results,connection){
			if(kutils.checkError(err,res)){
				kutils.ok(res);
			}
			connection.release();
		}));
	}else{
		kutils.forbiden(res);
	}
});
/* fonction déplacée : editItem */

/*================================================
	recherche_categorie
==================================================*/

app.get("/items/category/:category",function(req,res){
	var category = req.params.category;
	try{
		check(category).isNumeric();
	} catch (e){
		kutils.badRequest(res);
		return;
	}
	pool.getConnection(services.getItemByCategory(category,function(err,results,connection){
		if(kutils.checkError(err,res)){
			var itemList = results;
			res.contentType('application/json');
			res.send(JSON.stringify(itemList));
		}
		connection.release();
	}));
});
/* fonction déplacée : getItemByCategory */

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
	pool.getConnection(services.getItemByName(keyword,function(err,results,connection){
		if(kutils.checkError(err,res)){
			var itemList = results;
			res.contentType('application/json');
			res.send(JSON.stringify(itemList));
		}
		connection.release();
	}));
});
/* fonction déplacée : getItemByName */

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
	pool.getConnection(services.getItemDetail(itemId,req.session.user_id,function(err,results,connection){
		if(kutils.checkError(err,res)){
			var itemDetails = results;
			res.contentType('application/json');
			res.send(JSON.stringify(itemDetails));
		}
		connection.release();
	}));
});
/* fonction déplacée : getItemDetail */

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
		pool.getConnection(function(err,connexion){
			services.getConversationDetail(itemId,contactId,function(err,convResult){
				services.getMessagesList(itemId,contactId,req.session.user_id,function(err,msgListResult){
					if(err && err !== "notFound"){
						kutils.error(res,err);
					}else{
						var convDetails = convResult;
						markAsRead(req.session.user_id,contactId,itemId);
						convDetails.messages_list= msgListResult;
						res.contentType('application/json');
						console.log(convDetails);
						res.send(JSON.stringify(convDetails));
					}
				})(err, connexion);
			})(err,connexion);
		});
	}else{
		kutils.forbiden(res);
	}
});
/* fonction déplacée : getConversationDetail */
/* fonction déplacée : getMessagesList */

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
		pool.getConnection(services.newMessageFromItem(itemId, req.session.user_id, contactId, req.body.message,function(err,results,connection){
			if(kutils.checkError(err,res)){
				var eventString = contactId+req.session.user_id+itemId;
				var msg = {
					sender:'other',
					content:req.body.message,
					date:(new Date()).toISOString()
				};

				if(notifier.listeners(eventString).length !== 0){ //si le contact est en ligne avec nous, on lui envoie directement la réponse
					notifier.emit(eventString,msg);
				}else if(notifier.listeners(contactId).length !== 0){ //si il est connecté mais pas en train de parler avec nous, on lui envoie une notification et on ajoute ça a la liste des messages non-lus
					var notif = {
						type:"message",
						contact:req.session.user_id
					};
					addToUnread(contactId,req.session.user_id,itemId);
					notifier.emit(contactId,notif);
				}else{ //sinon on ajoute juste ça à la liste de ces messages non lu
					addToUnread(contactId,req.session.user_id,itemId);
				}
				kutils.ok(res);
			}
			connection.release();
		}));
	}else{
		kutils.forbiden(res);
	}
});
/* fonction déplacée : newMessage */

/*================================================
	Mes_conversations
==================================================*/

app.get("/messages/conversations",function(req,res){
	if(req.session.user_id){//on a besoin d'être authentifié pour voir cette page
		var myId = req.session.user_id;
		pool.getConnection(services.getConversationsList(myId,function(err,results,connection){
			var convList = !err?results:null;
			listUnread(err,myId,convList,function(err,cL){
				if(kutils.checkError(err,res)){
					res.contentType('application/json');
					res.send(JSON.stringify(cL));
				}
			});
			connection.release();

		}));
	}else{
		kutils.forbiden(res);
	}
});
/* fonction déplacée : getConversationsList */

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
	};
}

app.get("/waitMessage/:itemId/:contactId",function(req,res){
	
	function rmListener(){
		notifier.removeListener(eventString, evtCb);
	}
	
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

		res.on('close',rmListener); //lorsque la connexion est rompue, on supprime l'abonnement.
		res.on('kend',rmListener); //lorsque la connexion a retournée un resultat, on supprime aussi l'abonnement
	}else{
		kutils.forbiden(res);
	}
});

app.get("/notifs",function(req,res){
	function rmListener(){
		notifier.removeListener(eventString, evtCb);
	}
	if(req.session.user_id){
		var myId = req.session.user_id;
		var eventString = myId;
		var evtCb = longPollResponse(res);

		notifier.on(eventString, evtCb); //on s'abonne aux notifications concernant mon identifiant
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
	};
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
console.log("Penser à lancer redis-server !!!");
