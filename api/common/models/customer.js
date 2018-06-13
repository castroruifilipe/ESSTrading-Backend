'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userImage = require('../constants/userImage');


module.exports = function (Customer) {
    // Customer.validatesUniquenessOf('email');

    function hashPassword(password) {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }

    function comparePassword(password, hash) {
        if (!hash || !password) {
            return Promise.resolve(false);
        }
        return bcrypt.compare(password, hash);
    }

    function createAuthToken(customer) {
        return jwt.sign({ customerId: customer.id }, 'SECRET');
    }

    Customer.decodeToken = function (authHeader) {
        if (!authHeader) {
            return false;
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2) {
            return false;
        }
        return jwt.verify(parts[1], 'SECRET');
    }


    Customer.signup = function (data, callback) {
        if (!data.email || !data.password || !data.username) {
            return callback(new Error('Dados inválidos'));
        }
        Customer
            .create({
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                username: data.username,
                password: hashPassword(data.password),
                contacto: data.contacto,
                saldo: 10000,
                image: userImage,
                imageCroped: userImage,
            })
            .then(customer => callback(null, "Utilizador registado com sucesso"))
            .catch(error => callback(error));
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
        Customer
            .findOne({ where: { email: credentials.email } })
            .then(customer => {
                if (!customer) {
                    throw new Error('Credenciais inválidas');
                }
                return comparePassword(credentials.password, customer.password)
                    .then(isValid => {
                        if (!isValid) {
                            throw new Error('Credenciais inválidas');
                        }
                        return createAuthToken(customer);
                    })
            })
            .then(customer => callback(null, customer))
            .catch(error => callback(error));
    }

    Customer.remoteMethod(
        'signin',
        {
            accepts: { arg: 'credentials', type: 'object', required: true, http: { source: 'body' } },
            returns: { arg: 'accessToken', type: 'object', root: true },
            http: { verb: 'post' },
        }
    );


    Customer.changePassword = function (req, data, callback) {
        const payload = Customer.decodeToken(req.headers.authorization);
        if (!payload) {
            return callback(new Error("Sem autorização"));
        }
        if (!data.oldPassword || !data.newPassword) {
            return callback(new Error("Credenciais inválidas1"));
        }
        Customer
            .findById(payload.customerId)
            .then(customer => {
                comparePassword(data.oldPassword, customer.password)
                    .then(isValid => {
                        if (!isValid) {
                            throw new Error('Credenciais inválidas');
                        } else {
                            customer
                                .updateAttribute('password', hashPassword(data.newPassword))
                                .then(() => callback(null))
                        }
                    })
                    .catch(error => callback(error));
            })
            .catch(error => callback(error));
    }

    Customer.remoteMethod(
        'changePassword',
        {
            accepts: [
                { arg: 'req', type: 'object', http: { source: 'req' } },
                { arg: 'data', type: 'any', required: true, http: { source: 'body' } },
            ],
            http: { verb: 'put' },
        }
    );


    Customer.getProfile = function (req, callback) {
        const payload = Customer.decodeToken(req.headers.authorization);
        if (!payload) {
            return callback(new Error("Sem autorização"));
        }
        Customer
            .findById(payload.customerId)
            .then(customer => callback(null, customer))
            .catch(error => callback(error));
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
        const payload = Customer.decodeToken(req.headers.authorization);
        if (!payload) {
            return callback(new Error("Sem autorização"));
        }
        Customer
            .updateAll({ id: payload.customerId }, data)
            .then(res => Customer.findById(payload.customerId))
            .then(customer => callback(null, customer))
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


    Customer.depositarPlafond = function (req, data, callback) {
        const payload = Customer.decodeToken(req.headers.authorization);
        if (!payload) {
            return callback(new Error("Sem autorização"));
        }
        if (!data.valor) {
            return callback(new Error("Dados inválidos"));
        }
        if (data.valor <= 0) {
            return callback(new Error("Dados inválidos"));
        }
        Customer
            .findById(payload.customerId)
            .then(customer => {
                customer
                    .updateAttribute('saldo', customer.saldo + data.valor)
                    .then(() => callback(null, customer))
            })
            .catch(error => callback(error));
    }

    Customer.remoteMethod(
        'depositarPlafond',
        {
            accepts: [
                { arg: 'req', type: 'object', http: { source: 'req' } },
                { arg: 'data', type: 'any', required: true, http: { source: 'body' } },
            ],
            returns: { arg: 'userProfile', type: 'object', root: true },
            http: { verb: 'put' },
        }
    );


    Customer.levantarPlafond = function (req, data, callback) {
        const payload = Customer.decodeToken(req.headers.authorization);
        if (!payload) {
            return callback(new Error("Sem autorização"));
        }
        if (!data.valor) {
            return callback(new Error("Dados inválidos"));
        }
        if (data.valor <= 0) {
            return callback(new Error("Dados inválidos"));
        }
        Customer
            .findById(payload.customerId)
            .then(customer => {
                if (customer.saldo < data.valor) {
                    throw new Errow("Não foi possível levantar o valor");
                }
                customer
                    .updateAttribute('saldo', customer.saldo - data.valor)
                    .then(() => callback(null, customer))
            })
            .catch(error => callback(error));
    }

    Customer.remoteMethod(
        'levantarPlafond',
        {
            accepts: [
                { arg: 'req', type: 'object', http: { source: 'req' } },
                { arg: 'data', type: 'any', required: true, http: { source: 'body' } },
            ],
            returns: { arg: 'userProfile', type: 'object', root: true },
            http: { verb: 'put' },
        }
    );


    Customer.deleteProfile = function (req, data, callback) {
        const payload = Customer.decodeToken(req.headers.authorization);
        if (!payload) {
            return callback(new Error("Sem autorização"));
        }
        if (!data.password) {
            return callback(new Error("Credenciais inválidas"));
        }

        Customer
            .findById(payload.customerId)
            .then(customer => comparePassword(data.password, customer.password))
            .then(isValid => {
                if (!isValid) {
                    throw new Error('Credenciais inválidas');
                }
            })
            .then(() => Customer.destroyById(payload.customerId))
            .then(() => callback(null))
            .catch(error => callback(error));
    }

    Customer.remoteMethod(
        'deleteProfile',
        {
            accepts: [
                { arg: 'req', type: 'object', http: { source: 'req' } },
                { arg: 'data', type: 'any', required: true, http: { source: 'body' } },
            ],
            http: { verb: 'post' },
        }
    );
};
