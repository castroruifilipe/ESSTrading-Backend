'use strict';

var firebase = require('firebase');
var admin = require('firebase-admin');
let userImage = require('../constants/userImage');

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

    async function verifyToken(req) {
        let authToken = req.headers.authorization;
        const verifiedToken = await admin.auth().verifyIdToken(authToken);
        return verifiedToken.email;
    }


    Customer.signup = function (data, callback) {
        if (!data.email || !data.password || !data.username) {
            return callback(new Error('Dados inválidos'));
        }
        if (typeof data.password == 'string') {
            if (data.password.length < 6) {
                return callback(new Error('A password deverá ter no minímo 6 caracteres'));
            }
        }
        admin.auth().createUser({ email: data.email, password: data.password, emailVerified: true })
            .then(userRecord => Customer.create({
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                username: data.username,
                contacto: data.contacto,
                saldo: 10000,
                image: userImage,
                imageCroped: userImage,
            }))
            .then(customer => callback(null, "Utilizador registado com sucesso"))
            .catch(error => callback(new Error('Não foi possível registar o utilizador')));
    }

    Customer.remoteMethod(
        'signup',
        {
            accepts: { arg: 'data', type: 'object', required: true, http: { source: 'body' } },
            http: { verb: 'post' },
        }
    );


    Customer.signin = function (credentials, callback) {
        if (!credentials.email || !credentials.password) {
            return callback(new Error('Credenciais inválidas'));
        }
        auth.signInWithEmailAndPassword(credentials.email, credentials.password)
            .then(userRecord => admin.auth().createCustomToken(userRecord.user.uid, { email: credentials.email }))
            .then(token => callback(null, token))
            .catch(error => callback(new Error('Credenciais inválidas')));
    }

    Customer.remoteMethod(
        'signin',
        {
            accepts: { arg: 'credentials', type: 'object', required: true, http: { source: 'body' } },
            returns: { arg: 'accessToken', type: 'object', root: true },
            http: { verb: 'post' },
        }
    );


    Customer.getProfile = function (req, callback) {
        verifyToken(req)
            .then(email => Customer.findOne({ where: { email } }))
            .then(customer => callback(null, customer))
            .catch(error => callback(new Error("Sem autorização")));
    }

    Customer.remoteMethod(
        'getProfile',
        {
            accepts: { arg: 'req', type: 'object', http: { source: 'req' } },
            returns: { arg: 'userProfile', type: 'object', root: true },
            http: { verb: 'get' },
        }
    );


    Customer.updateProfile = function (req, data, callback) {
        verifyToken(req)
            .then(email => {
                Customer.updateAll({ email }, data)
                    .then(res => Customer.findOne({ where: { email } }))
                    .then(customer => callback(null, customer))
            })
            .catch(error => callback(error));
    }

    Customer.remoteMethod(
        'updateProfile',
        {
            accepts: [
                { arg: 'req', type: 'object', http: { source: 'req' } },
                { arg: 'data', type: 'any', required: true, http: { source: 'body' } },
            ],
            returns: { arg: 'userProfile', type: 'object', root: true },
            http: { verb: 'put' },
        }
    );
};
