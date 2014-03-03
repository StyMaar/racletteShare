var imagemagick = require('imagemagick');

var mysql = require('mysql');
var pool = mysql.createPool({
	host:'localhost',
	user:'root',
	password:'1234poney',
	database:'raclette'
});

var kutils = require('./kutils');

/* Définition des fonctions suivantes : doLogin, createUser, getUserInfo, getCategories, getItemList, deleteItem, (savePictures, deleteFile, newItem)
ET : getMyItem, editItem, getItemByCategory, getItemByName, getItemDetail, getConversationDetail, getMessagesList, newMessage, getConversationsList.
 */

exports.doLogin = function doLogin(login, password, callback){ 
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

exports.createUser = function createUser(user, callback){
	var id = kutils.uuid();
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

/*
  getUserInfo : récupère les informations de base sur un utilisateur, elle est utilisée un grand nombre de fois, pas seulement pour le dashboard
  fonction faite pour être appelée avec async
*/

exports.getUserInfo = function getUserInfo(userId, callback){
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

exports.getCategories = function getCategories(callback){
	pool.getConnection(function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err);
			return;
		}
		//le fonctionnement du système impose que les id des catégories soient des entiers consécutifs de 0 à nombre_catégorie-1 => categorie[4].id == 4
		connection.query('SELECT label, id FROM category ORDER BY id', [], function(err, rows) {
			connection.release();//on libère la connexion pour la remettre dans le pool dès qu'on n'en a plus besoin
			callback(err,rows);
		});
	});
}

/*
  getItemList : récupère la liste des objets appartenant à l'utilisateur dont l'id vaut : userId
  cette fonction retourne une fonction qui peut être utilisée par async pour paralléliser les tâches : 
	i.e. une fonction prenant un seul paramètre qui est une fonction "callback".

	Toutes les fonctions d'accès à la base de donnée seront de cette forme là, celà permettra de pouvoir les paralléliser sans peine
*/

exports.getItemList = function getItemList(userId, callback){
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

/*
  deleteItem : fonction assurant la suppression d'un objet dans la base de donnée pour peu qu'on ai les droits sur cet objet.
*/

exports.deleteItem = function deleteItem(userId, itemId, callback){
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

//Bloc avec le Delete file : savePictures, deleteFile, newItem.

exports.savePictures = function savePictures(uploadPath,itemId,callback){
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

exports.deleteFile = function deleteFile(path){
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

exports.newItem = function newItem(userId, item, callback){
	var id = kutils.uuid();
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

/*
  -------------------------------------------------------------------------------------------------------------------------------------------------------------
  Nouveau bloc : getMyItem, editItem, getItemByCategory, getItemByName, getItemDetail, getConversationDetail, getMessagesList, newMessage, getConversationsList.
  -------------------------------------------------------------------------------------------------------------------------------------------------------------
*/

exports.getMyItem = function getMyItem(itemId, userId, callback){
	pool.getConnection(function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err);
			return;
		}
		connection.query('SELECT name, description, category FROM item WHERE item.id= ? AND user_id = ?', [itemId, userId], function(err, rows) {
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

exports.editItem = function editItem(userId, item, itemId, callback){
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

exports.getItemByCategory = function getItemByCategory(category, callback){
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

exports.getItemByName = function getItemByName(keyword){
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


//ici le userId est là a titre informatif, on indiquera d'une façon spéciale dans la liste les objets qui m'appartiennent.
exports.getItemDetail = function getItemDetail(itemId,userId, callback){
	pool.getConnection(function(err,connection){
		//on s'assure que l'appel d'une connection dans le pool se passe bien.
		if(err){
			callback(err);
			return;
		}
		connection.query("SELECT if( item.user_id = ?, 'mine', '' ) as isMine, item.name as name, item.description as description, category.label as category, user.name as ownerName, item.user_id as ownerId FROM item INNER JOIN user ON item.user_id=user.id INNER JOIN category ON category.id=item.category WHERE item.id= ?", [userId, itemId], function(err, rows) {
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


exports.getConversationDetail = function getConversationDetail(itemId,contactId, callback){
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

exports.getMessagesList = function getMessagesList(itemId,contactId,myId, callback){
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

exports.newMessage = function newMessage(itemId, myId, contactId, message, callback){
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

exports.getConversationsList = function getConversationsList(myId, callback){
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




