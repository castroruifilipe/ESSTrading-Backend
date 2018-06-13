'use strict';

var app = require('../../server/server');

module.exports = function (Movimento) {

    Movimento.getMovs = function (req, callback) {
        const payload = app.models.Customer.decodeToken(req.headers.authorization);
        if (!payload) {
            return callback(new Error("Sem autorização"));
        }
        Movimento
            .find({ where: { customer: payload.customerId }, order: 'dataFecho DESC' })
            .then(movs => callback(null, movs))
            .catch(error => callback(error));
    }

    Movimento.remoteMethod(
        'getMovs',
        {
            accepts: { arg: 'req', type: 'object', http: { source: 'req' } },
            returns: { arg: 'movs', type: 'array', root: true },
            http: { verb: 'get' },
        }
    );
};
