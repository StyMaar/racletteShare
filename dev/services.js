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

exports.doLogin = function doLogin(login, password, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		// FIXME : un simple sha2 sans sel ? je pourrais au moins faire la concaténation login + password pour éviter les colisions ...
		connection.query('SELECT id FROM user WHERE login = ? AND password = SHA2(?, 224)', [login,password], function(err, rows) {
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
		connection.query('INSERT INTO user (id, login, name, password ,city, tel) \
		VALUES (?,?,?,SHA2(?, 224),?,?)', [id, user.login, user.name, user.password, user.city, user.tel], function(err, results) {

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
		connection.query('UPDATE user set password=SHA2(?, 224) WHERE login=?', [newPassword, email], function(err, results) {
			err = kutils.checkUpdateErr(err,results);
			callback(err, newPassword, connection);
		});
	};
};

//Pour changer le mot de passe manuellement.
exports.changePassword = function changePassword(userId, oldPassword, newPassword, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,connection);
			return;
		}
		connection.query('UPDATE user set password=SHA2(?, 224) WHERE id=? AND password=SHA2(?, 224)', [newPassword, userId, oldPassword], function(err, results) {

			err = kutils.checkUpdateErr(err,results);
			callback(err,connection);
		});
	};
};


/*
  getUserInfo : récupère les informations de base sur un utilisateur, elle est utilisée un grand nombre de fois, pas seulement pour le dashboard
  fonction faite pour être appelée avec async
*/

exports.getUserInfo = function getUserInfo(userId, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('SELECT name, id, city FROM user WHERE id = ?', [userId], function(err, rows) {

			var userData = null;
			if(!err){
				if(rows && rows.length !== 0){
					userData = rows[0];
				}else{
					err = "notFound";
				}
			}
			callback(err,userData,connection);
		});
	};
};

exports.getCategories = function getCategories(callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		//le fonctionnement du système impose que les id des catégories soient des entiers consécutifs de 0 à nombre_catégorie-1 => categorie[4].id == 4
		connection.query('SELECT label, id FROM category ORDER BY id', [], function(err, rows) {

			callback(err,rows,connection);
		});
	};
};

/*
  getItemList : récupère la liste des objets appartenant à l'utilisateur dont l'id vaut : userId
  cette fonction retourne une fonction qui peut être utilisée par async pour paralléliser les tâches :
	i.e. une fonction prenant un seul paramètre qui est une fonction "callback".

	Toutes les fonctions d'accès à la base de donnée seront de cette forme là, celà permettra de pouvoir les paralléliser sans peine
*/

exports.getItemList = function getItemList(userId, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('SELECT name as nom_objet, id FROM item WHERE user_id=?', [userId], function(err, rows) {

			callback(err,rows,connection);
		});
	};
};

/*
  deleteItem : fonction assurant la suppression d'un objet dans la base de donnée pour peu qu'on ai les droits sur cet objet.
*/

exports.deleteItem = function deleteItem(userId, itemId, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('DELETE FROM item WHERE user_id = ? AND id = ?', [userId, itemId] , function(err, results) {

			err = kutils.checkUpdateErr(err,results);
			callback(err,null,connection);
		});
	};
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
};

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
		connection.query('INSERT INTO item (id, user_id, name, description, category) \
		VALUES (?,?,?,?,?)', [id, userId, item.nom_objet, item.description, item.category], function(err, results) {

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
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('SELECT id, name as nom_objet, description, category FROM item WHERE item.id= ? AND user_id = ?', [itemId, userId], function(err, rows) {

			var itemDetails = null;
			if(!err){
				if(rows && rows.length!==0){
					itemDetails = rows[0];
				}else{
					err = "notFound";
				}
			}
			callback(err,itemDetails,connection);
		});
	};
};

exports.editItem = function editItem(userId, item, itemId, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('UPDATE `item` SET `name`=?,`description`=?,`category`=? WHERE id=? AND user_id = ?', [item.nom_objet, item.description, item.category, itemId, userId], function(err, results) {

			err = kutils.checkUpdateErr(err,results);
			callback(err,null,connection);
		});
	};
};

exports.getItemByCategory = function getItemByCategory(category, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('SELECT item.id as id, user.name as owner_name, item.name as nom_objet FROM item INNER JOIN user ON item.user_id=user.id WHERE item.category= ?', [category], function(err, rows) {

			if(!err){
				if(!rows || rows.length===0){
					err = "notFound";
				}
			}
			callback(err,rows,connection);
		});
	};
};

exports.getItemByName = function getItemByName(keyword, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('SELECT item.id as id, user.name as owner_name, item.name as nom_objet FROM item INNER JOIN user ON item.user_id=user.id WHERE MATCH (item.name,item.description) AGAINST (?)', [keyword], function(err, rows) {

			if(!err){
				if(!rows || rows.length===0){
					err = "notFound";
				}
			}
			callback(err,rows,connection);
		});
	};
};


//ici le userId est là a titre informatif, on indiquera d'une façon spéciale dans la liste les objets qui m'appartiennent.
exports.getItemDetail = function getItemDetail(itemId, userId, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query("SELECT if( item.user_id = ?, 'mine', '' ) as is_mine, item.name as nom_objet, item.description as description, category.label as category_label, category.id as category_id, user.name as owner_name, item.user_id as owner_id FROM item INNER JOIN user ON item.user_id=user.id INNER JOIN category ON category.id=item.category WHERE item.id= ?", [userId, itemId], function(err, rows) {

			var itemDetails = null;
			if(!err){
				if(rows && rows.length!==0){
					itemDetails = rows[0];
				}else{
					err = "notFound";
				}
			}
			callback(err,itemDetails,connection);
		});
	};
};

exports.newDemande = function newDemande(userId, demande, callback){
	return function(err,connection){
		var id = kutils.uuid();
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('INSERT INTO demande (id, user_id, name, description, category, date) \
		VALUES (?,?,?,?,?,NOW())', [id, userId, demande.nom_demande, demande.description, demande.category], function(err, results) {

			err = kutils.checkUpdateErr(err,results);
			callback(err,id,connection);
		});
	};
};

exports.deleteDemande = function deleteDemande(userId, demandeId, callback){
	return function(err,connection){
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('DELETE FROM demande WHERE user_id = ? AND id = ?', [userId, demandeId] , function(err, results) {

			err = kutils.checkUpdateErr(err,results);
			callback(err,null,connection);
		});
	};
};

exports.getDemandeList = function getDemandeList(userId, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('SELECT name as nom_demande, id FROM demande WHERE user_id=?', [userId], function(err, rows) {

			callback(err,rows,connection);
		});
	};
};

/*
Récupère le détail d'une demande appartenant à l'utilisateur d'id userId. Seul l'utilisateur en question peut récupérer ce détail.
*/

exports.getMyDemande = function getMyDemande(demandeId, userId, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('SELECT id, name as nom_demande, description, category FROM demande WHERE demande.id= ? AND user_id = ?', [demandeId, userId], function(err, rows) {
			var demandeDetails = null;
			if(!err){
				if(rows && rows.length!==0){
					demandeDetails = rows[0];
				}else{
					err = "notFound";
				}
			}
			callback(err,demandeDetails,connection);
		});
	};
};

exports.editDemande = function editDemande(userId, demande, demandeId, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('UPDATE `demande` SET `name`=?,`description`=?,`category`=? WHERE id=? AND user_id = ?', [demande.nom_demande, demande.description, demande.category, demandeId, userId], function(err, results) {

			err = kutils.checkUpdateErr(err,results);
			callback(err,null,connection);
		});
	};
};


exports.getDemandeByCategory = function getDemandeByCategory(category, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('SELECT  demande.id as id, user.name as owner_name,  demande.name as nom_demande FROM demande INNER JOIN user ON  demande.user_id=user.id WHERE  demande.category= ?', [category], function(err, rows) {

			if(!err){
				if(!rows || rows.length===0){
					err = "notFound";
				}
			}
			callback(err,rows,connection);
		});
	};
};

exports.getDemandeByName = function getDemandeByName(keyword, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query('SELECT demande.id as id, user.name as owner_name, demande.name as nom_demande FROM demande INNER JOIN user ON demande.user_id=user.id WHERE MATCH (demande.name,demande.description) AGAINST (?)', [keyword], function(err, rows) {

			if(!err){
				if(!rows || rows.length===0){
					err = "notFound";
				}
			}
			callback(err,rows,connection);
		});
	};
};

exports.getDemandeDetail = function getDemandeDetail(demandeId, userId, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query("SELECT if( demande.user_id = ?, 'mine', '' ) as is_mine, demande.name as name, demande.description as description, category.label as category_label, category.id as category_id, user.name as owner_name, demande.user_id as owner_id FROM demande INNER JOIN user ON demande.user_id=user.id INNER JOIN category ON category.id=demande.category WHERE demande.id= ?", [userId, demandeId], function(err, rows) {

			var demandeDetails = null;
			if(!err){
				if(rows && rows.length!==0){
					demandeDetails = rows[0];
				}else{
					err = "notFound";
				}
			}
			callback(err,demandeDetails,connection);
		});
	};
};

exports.getConversationDetail = function getConversationDetail(itemId, contactId, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
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

			var convDetails = null;
			if(!err){
				if(rows && rows.length!==0){
					convDetails = rows[0];
				}else{
					err = "notFound";
				}
			}
			callback(err,convDetails,connection);
		});
	};
};

exports.getMessagesList = function getMessagesList(itemId,contactId,myId, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
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

			var msgList = rows;
			callback(err,msgList,connection);
		});
	};
};

exports.newMessage = function newMessage(itemId, myId, contactId, message, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query("INSERT INTO message (item_id, sender_id, content, date, receiver_id ) \
		SELECT ?, ?, ?, NOW(), ? FROM item WHERE id = ? AND (user_id = ? OR user_id = ?)", [itemId, myId, message, contactId, itemId, myId, contactId] , function(err, results) {
			err = kutils.checkUpdateErr(err,results);
			callback(err,null,connection);
		});
	};
};

exports.getConversationsList = function getConversationsList(myId, callback){
	return function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err,null,connection);
			return;
		}
		connection.query("SELECT DISTINCT user.id AS contact_id, user.name AS nom_contact, item.id AS item_id, item.name AS nom_objet \
						FROM (\
							SELECT item_id, IF( message.sender_id = ?, message.receiver_id, IF( message.receiver_id = ?, message.sender_id, NULL ) ) AS contact_id \
							FROM message \
						)A \
						INNER JOIN user ON A.contact_id = user.id\
						INNER JOIN item ON A.item_id = item.id", [myId,myId], function(err, rows) {

			var convList = rows;
			callback(err,convList,connection);
		});
	};
};
