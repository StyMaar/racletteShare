var imagemagick = require('imagemagick');
var async = require('async');
var fs = require('fs');

var kutils = require('./kutils');

/* Définition des fonctions suivantes : doLogin, createUser, getUserInfo, getCategories, getItemList, deleteItem, (savePictures, deleteFile, newItem)
ET : getMyItem, editItem, getItemByCategory, getItemByName, getItemDetail, getConversationDetail, getMessagesList, newMessage, getConversationsList.
 */
/*****

Toutes les fonctions définies dans ce module ont une structure commune :

pool.getConnection(dologin(param...));
*/

exports.doLogin = function doLogin(email, password, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		// FIXME : un simple sha2 sans sel ? je pourrais au moins faire la concaténation login + password pour éviter les colisions ...
		connection.query('SELECT id FROM user WHERE email = ? AND password = SHA2(?, 224)', [email,password], function(err, rows) {
			var id = null;
			if(!err){
				if(rows && rows.length !== 0){
						id = rows[0].id;
				}else{
					err = "forbiden";
				}
			}
			callback(err,id,connection);
		});
	};
};

exports.createUser = function createUser(user, callback){
	return function(err,connection){
		var id = kutils.uuid();
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('INSERT INTO user (id, email, name, password ,city, tel) VALUES (?,?,?,SHA2(?, 224),?,?)', [id, user.email, user.name, user.password, user.city, user.tel], function(err, results) {

			err = kutils.checkUpdateErr(err,results);
			callback(err,id,connection);
		});
	};
};

//Pour changer le mot de passe automatiquement en cas d'oubli de mot de passe.
//NOTE le fait de reset le password directement puis de l'envoyer par mail n'est pas forcément une bonne idée, et celà peut être la cible d'attaque.
exports.resetPassword = function resetPassword(email, callback){
	return function(err,connection){
		var newPassword = kutils.uuid(); //le password en question est un UUID, c'est pas le truc le plus opti mais ça marche et c'est censé être safe.
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('UPDATE user set password=SHA2(?, 224) WHERE email=?', [newPassword, email], function(err, results) {
			err = kutils.checkUpdateErr(err,results);
			callback(err, newPassword, connection);
		});
	};
};

//Pour changer le mot de passe manuellement.
exports.changePassword = function changePassword(userId, oldPassword, newPassword, callback){
	return kutils.dbUpdate('UPDATE user set password=SHA2(?, 224) WHERE id=? AND password=SHA2(?, 224)', [newPassword, userId, oldPassword], callback);
};


/*
  getUserInfo : récupère les informations de base sur un utilisateur, elle est utilisée un grand nombre de fois, pas seulement pour le dashboard
  fonction faite pour être appelée avec async
*/

exports.getUserInfo = function getUserInfo(userId, callback){
	return kutils.dbSelectOneLine('SELECT name, id, city FROM user WHERE id = ?', [userId], callback);
};

exports.getCategories = function getCategories(callback){
	return kutils.dbSelectList('SELECT label, id FROM category ORDER BY id', [], callback);
};

/*
  getItemList : récupère la liste des objets appartenant à l'utilisateur dont l'id vaut : userId
  cette fonction retourne une fonction qui peut être utilisée par async pour paralléliser les tâches :
	i.e. une fonction prenant un seul paramètre qui est une fonction "callback".

	Toutes les fonctions d'accès à la base de donnée seront de cette forme là, celà permettra de pouvoir les paralléliser sans peine
*/

exports.getItemList = function getItemList(userId, callback){
	return kutils.dbSelectList('SELECT name as nom_objet, id FROM item WHERE user_id=?', [userId], callback);
};

/*
  deleteItem : fonction assurant la suppression d'un objet dans la base de donnée pour peu qu'on ai les droits sur cet objet.
*/

exports.deleteItem = function deleteItem(userId, itemId, callback){
	return kutils.dbUpdate('DELETE FROM item WHERE user_id = ? AND id = ?', [userId, itemId], callback);
};

//Bloc avec le Delete file : savePictures, deleteFile, newItem.

exports.savePictures = function savePictures(uploadPath,itemId,getPicturePathFromId,getMiniPicPathFromId,callback){
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
			imagemagick.convert([uploadPath,'-resize', bigDimensions, itemPicPath], function(err){
				console.log("grosse image crée pour l'item :"+itemId);
				async_callback(err);
			});
		},
		function(async_callback){
			imagemagick.convert([uploadPath,'-resize', miniDimensions, itemMiniPicPath], function(err){
				console.log("mini image crée pour l'item :"+itemId);
				async_callback(err);
			});
		}
	],
	function(err) {
		deleteFile(uploadPath);
		callback(err);
	});
};

function deleteFile(path){ //on met deleteFile dans le scope pour que la fonction puisse être utilisée par les autres fonctions du module.
	fs.unlink(path, function (err) {
		if (err){
			console.log(err);
			console.log('impossible de supprimer '+ path);
		}else{
			console.log('successfully deleted '+ path);
		}
	});
}

exports.deleteFile = deleteFile;

/*
  newItem : prend les infos correspondant au nouvel objet
  et créé cet objet dans la base
*/

exports.newItem = function newItem(userId, item, callback){
	return function(err,connection){
		var id = kutils.uuid();
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('INSERT INTO item (id, user_id, name, description, category) VALUES (?,?,?,?,?)', [id, userId, item.nom_objet, item.description, item.category], function(err, results) {

			err = kutils.checkUpdateErr(err,results);
			callback(err,id,connection);
		});
	};
};

/*
  -------------------------------------------------------------------------------------------------------------------------------------------------------------
  Nouveau bloc : getMyItem, editItem, getItemByCategory, getItemByName, getItemDetail, getConversationDetail, getMessagesList, newMessage, getConversationsList.
  -------------------------------------------------------------------------------------------------------------------------------------------------------------
*/

exports.getMyItem = function getMyItem(itemId, userId, callback){
	return kutils.dbSelectOneLine('SELECT id, name as nom_objet, description, category FROM item WHERE item.id= ? AND user_id = ?', [itemId, userId], callback);
};

exports.editItem = function editItem(userId, item, itemId, callback){
	return kutils.dbUpdate('UPDATE `item` SET `name`=?,`description`=?,`category`=? WHERE id=? AND user_id = ?', [item.nom_objet, item.description, item.category, itemId, userId], callback);
};

exports.getItemByCategory = function getItemByCategory(category, callback){
	return kutils.dbSelectList('SELECT item.id as id, user.name as owner_name, item.name as nom_objet FROM item INNER JOIN user ON item.user_id=user.id WHERE item.category= ?', [category], callback);
};

exports.getItemByName = function getItemByName(keyword, callback){
	return kutils.dbSelectList('SELECT item.id as id, user.name as owner_name, item.name as nom_objet FROM item INNER JOIN user ON item.user_id=user.id WHERE MATCH (item.name,item.description) AGAINST (?)', [keyword], callback);
};


//ici le userId est là a titre informatif, on indiquera d'une façon spéciale dans la liste les objets qui m'appartiennent.
exports.getItemDetail = function getItemDetail(itemId, userId, callback){
	return kutils.dbSelectOneLine("SELECT if( item.user_id = ?, 'mine', '' ) as is_mine, item.name as nom_objet, item.description as description, category.label as category_label, category.id as category_id, user.name as owner_name, item.user_id as owner_id FROM item INNER JOIN user ON item.user_id=user.id INNER JOIN category ON category.id=item.category WHERE item.id= ?", [userId, itemId], callback);
};

exports.newDemande = function newDemande(userId, demande, callback){
	return function(err,connection){
		var id = kutils.uuid();
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('INSERT INTO demande (id, user_id, name, description, category, date) VALUES (?,?,?,?,?,NOW())', [id, userId, demande.nom_demande, demande.description, demande.category], function(err, results) {

			err = kutils.checkUpdateErr(err,results);
			callback(err,id,connection);
		});
	};
};

exports.deleteDemande = function deleteDemande(userId, demandeId, callback){
	return kutils.dbUpdate('DELETE FROM demande WHERE user_id = ? AND id = ?', [userId, demandeId], callback)
};

exports.getDemandeList = function getDemandeList(userId, callback){
	return kutils.dbSelectList('SELECT name as nom_demande, id FROM demande WHERE user_id=?', [userId], callback);
};

/*
Récupère le détail d'une demande appartenant à l'utilisateur d'id userId. Seul l'utilisateur en question peut récupérer ce détail.
*/

exports.getMyDemande = function getMyDemande(demandeId, userId, callback){
	return kutils.dbSelectOneLine('SELECT id, name as nom_demande, description, category FROM demande WHERE demande.id= ? AND user_id = ?', [demandeId, userId], callback);
};

exports.editDemande = function editDemande(userId, demande, demandeId, callback){
	return kutils.dbUpdate('UPDATE `demande` SET `name`=?,`description`=?,`category`=? WHERE id=? AND user_id = ?', [demande.nom_demande, demande.description, demande.category, demandeId, userId], callback);
};


exports.getDemandeByCategory = function getDemandeByCategory(category, callback){
	return kutils.dbSelectList('SELECT  demande.id as id, user.name as owner_name,  demande.name as nom_demande FROM demande INNER JOIN user ON  demande.user_id=user.id WHERE  demande.category= ?', [category], callback);
};

exports.getDemandeByName = function getDemandeByName(keyword, callback){
	return kutils.dbSelectList('SELECT demande.id as id, user.name as owner_name, demande.name as nom_demande FROM demande INNER JOIN user ON demande.user_id=user.id WHERE MATCH (demande.name,demande.description) AGAINST (?)', [keyword], callback);
};

exports.getDemandeDetail = function getDemandeDetail(demandeId, userId, callback){
	return kutils.dbSelectOneLine("SELECT if( demande.user_id = ?, 'mine', '' ) as is_mine, demande.name as name, demande.description as description, category.label as category_label, category.id as category_id, user.name as owner_name, demande.user_id as owner_id FROM demande INNER JOIN user ON demande.user_id=user.id INNER JOIN category ON category.id=demande.category WHERE demande.id= ?", [userId, demandeId], callback);
};

//where postId can be an itemId or a demandeId
exports.getConversationDetail = function getConversationDetail(postId, contactId, callback){
	return kutils.dbSelectOneLine("SELECT * \
	FROM (\
		SELECT name AS nom_contact\
		FROM user\
		WHERE id = ?\
	)A, (\
			SELECT name AS nom_objet\
			FROM item\
			WHERE id = ?\
		UNION \
			SELECT name AS nom_demande\
			FROM demande\
			WHERE id = ?\
	)B", [contactId, postId, postId], callback);
};

//where postId can be an itemId or a demandeId
exports.getMessagesList = function getMessagesList(postId, contactId,myId, callback){
	return kutils.dbSelectList("SELECT message.date, \
							message.content, \
							IF(message.sender_id = ?,'me','other') AS sender \
						FROM \
							message \
						WHERE message.item_id = ? OR message.demande_id = ?\
							AND ( \
							(message.sender_id = ? AND message.receiver_id = ?) OR (message.sender_id = ? AND message.receiver_id = ?) \
							) \
						ORDER BY message.date; ", [myId, postId, postId, myId, contactId, contactId, myId], callback);
};

exports.newMessageFromItem = function newMessageFromItem(itemId, myId, contactId, message, callback){
	return kutils.dbUpdate("INSERT INTO message (item_id, sender_id, content, date, receiver_id ) SELECT ?, ?, ?, NOW(), ? FROM item WHERE id = ? AND (user_id = ? OR user_id = ?)", [itemId, myId, message, contactId, itemId, myId, contactId] ,callback);
};

exports.newMessageFromDemande = function newMessageFromDemande(demandeId, myId, contactId, message, callback){
	return kutils.dbUpdate("INSERT INTO message (demande_id, sender_id, content, date, receiver_id ) SELECT ?, ?, ?, NOW(), ? FROM demande WHERE id = ? AND (user_id = ? OR user_id = ?)", [demandeId, myId, message, contactId, demandeId, myId, contactId] ,callback);
};

exports.getConversationsList = function getConversationsList(myId, callback){
	return kutils.dbSelectList("SELECT DISTINCT user.id AS contact_id, user.name AS nom_contact, item.id AS item_id, item.name AS nom_objet, demande.id AS demande_id, demande.name AS nom_demande\
						FROM (\
							SELECT item_id, demande_id, IF( message.sender_id = ?, message.receiver_id, IF( message.receiver_id = ?, message.sender_id, NULL ) ) AS contact_id \
							FROM message \
						)A \
						INNER JOIN user ON A.contact_id = user.id\
						LEFT JOIN item ON A.item_id = item.id \
						LEFT JOIN demande ON A.demande_id = demande.id", [myId,myId], callback);
};
