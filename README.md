#Dependencies:

##mySQL
RacletteShare needs mySQL 5.6 . If you're on Linux it might not be the default version of your distribution, so you'll have to install it specifically. For Debian based distributions : `sudo apt-get install mysql-server-5.6` 

###Database creation :

```
$ mysql -u root
```
```
mysql> CREATE DATABASE rs_db;
mysql> CREATE USER rs_user;
mysql> GRANT SELECT,INSERT,UPDATE,DELETE,CREATE ON rs_db.* TO 'rs_user'@'localhost';
```

```
$ mysql -u rs_user rs_db < raclette.sql 
```

##Redis
RacletteShare uses Redis for storing user session informations.