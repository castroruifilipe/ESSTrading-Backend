'use strict';

var firebase = require('firebase');
var admin = require('firebase-admin');

var serviceAccount = require('../../ess-trading-firebase-adminsdk-a6j28-14f8da65dd.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://ess-trading.firebaseio.com'
});

var config = {
    apiKey: "AIzaSyDwGpH8LJmxd0jY7OCNM2xKz9_-BKvfx3M",
    authDomain: "ess-trading.firebaseapp.com",
    databaseURL: "https://ess-trading.firebaseio.com",
    projectId: "ess-trading",
    storageBucket: "ess-trading.appspot.com",
    messagingSenderId: "607589122783"
};

if (!firebase.apps.length) {
    firebase.initializeApp(config);
}
const auth = firebase.auth();




module.exports = function (Customer) {


    Customer.signup = function (credentials, callback) {
        if (!credentials.email || !credentials.password || !credentials.username) {
            return callback(new Error('Credenciais inválidas'));
        }

        admin.auth().createUser({
            email: credentials.email,
            emailVerified: true,
            password: credentials.password,
        })
            .then(userRecord => Customer.create({ email: credentials.email, username: credentials.username }))
            .then(customer => callback(null))
            .catch(error => callback("Não foi possível registar o utilizador."));
    }

    Customer.signin = function (credentials, callback) {
        if (!credentials.email || !credentials.password) {
            return callback(new Error('Credenciais inválidas'));
        }
        auth.signInWithEmailAndPassword(credentials.email, credentials.password)
            .then(function (userRecord) {
                // See the UserRecord reference doc for the contents of userRecord.
                console.log("Successfully signin. User:", userRecord.user.uid);
                return admin.auth().createCustomToken(userRecord.user.uid, {
                    'email': credentials.email
                });
            })
            .then(token => callback(null, token))
            .catch(function (error) {
                console.log("Error signing in", error);
                callback(error)
            });
    }

    Customer.remoteMethod(
        'signup',
        {
            accepts: { arg: 'credentials', type: 'object', required: true, http: { source: 'body' } },
            // returns: { arg: 'accessToken', type: 'object', root: true },
            http: { verb: 'post' },
        }
    );

    Customer.remoteMethod(
        'signin',
        {
            accepts: { arg: 'credentials', type: 'object', required: true, http: { source: 'body' } },
            returns: { arg: 'accessToken', type: 'object', root: true },
            http: { verb: 'post' },
        }
    );
};
