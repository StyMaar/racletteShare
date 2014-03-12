#!/bin/bash

# Mettre les fichiers sur le serveur
scp -r dev/ bratsk:./poney
scp ./raclette.sql bratsk:./poney/

# on execute l'autre script : c'est lui qui s'occupera de charger la base de données et de lancer le serveur
ssh stymaar@bratsk 'bash -s' < remoteScript.sh

