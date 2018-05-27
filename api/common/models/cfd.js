'use strict';

const request = require('request-promise-native');

var app = require('../../server/server');


const tipoCFD2Price = {
    0: "askPrice",
    1: "bidPrice"
};

const tipoCFD2Designacao = {
    0: "Compra",
    1: "Venda"
};

module.exports = function (Cfd) {

    Cfd.abrirCFD = function (req, data, callback) {
        const payload = app.models.Customer.decodeToken(req.headers.authorization);
        if (!payload) {
            return callback(new Error("Sem autorização"));
        }
        if (!data.ativo) {
            return callback(new Error("Dados inválidos"));
        }

        request({
            url: `http://quotes:5000/quotes-ms/quote/${data.ativo}`,
            json: true
        })
            .then(quote => {
                let valorAbertura = quote[tipoCFD2Price[data.tipo]]
                let unidades = 0;
                let montante = 0;
                if (data.montante) {
                    montante = data.montante;
                    unidades = montante / valorAbertura;
                } else {
                    unidades = data.unidades;
                    montante = unidades * valorAbertura;
                }
                return Promise.all([valorAbertura, unidades, montante])
            })
            .then(([valorAbertura, unidades, montante]) =>
                app.models.Customer
                    .findById(payload.customerId)
                    .then(customer => {
                        const novoSaldo = customer.saldo - montante;
                        if (montante < 0) {
                            throw new Error("Não foi possível abrir o CFD");
                        } else {
                            customer.updateAttribute('saldo', novoSaldo);
                        }
                        return Promise.all([valorAbertura, unidades, montante, novoSaldo])
                    }))
            .then(([valorAbertura, unidades, montante, novoSaldo]) => {
                Cfd
                    .create({
                        ativo: data.ativo,
                        dataAbertura: new Date(Date.now()).toLocaleString(),
                        montante: montante,
                        tipo: data.tipo,
                        unidades: unidades,
                        valorAbertura: valorAbertura,
                        customer: payload.customerId,
                    })
                    .then(cfd => callback(null, { cfd, novoSaldo }))
                    .catch(error => callback(error))
            })
            .catch(error => callback(error))
    }

    Cfd.remoteMethod(
        'abrirCFD',
        {
            accepts: [
                { arg: 'req', type: 'object', http: { source: 'req' } },
                { arg: 'data', type: 'any', required: true, http: { source: 'body' } },
            ],
            returns: [
                { arg: 'cfd', type: 'object', root: true },
                { arg: 'saldo', type: 'number', root: true },
            ],
            http: { verb: 'post' },
        }
    );


    Cfd.fecharCFD = function (req, data, callback) {
        const payload = app.models.Customer.decodeToken(req.headers.authorization);
        if (!payload) {
            return callback(new Error("Sem autorização"));
        }
        if (!data.cfd) {
            return callback(new Error("Dados inválidos"));
        }

        Cfd
            .findById(data.cfd)
            .then(cfd =>
                Promise.all([
                    request({
                        url: `http://quotes:5000/quotes-ms/quote/${cfd.ativo}`,
                        json: true
                    }),
                    cfd
                ])
            )
            .then(([quote, cfd]) =>
                Promise.all([
                    app.models.Customer.findById(payload.customerId),
                    quote,
                    cfd
                ])
            )
            .then(([customer, quote, cfd]) => {
                const price = quote[tipoCFD2Price[1 - cfd.tipo]];
                const lucro_perda = (price - cfd.valorAbertura) * cfd.unidades;
                const percent_lucro_perda = (price - cfd.valorAbertura) / price;
                const novoSaldo = customer.saldo + cfd.montante + lucro_perda;
                const movimento = {
                    dataAbertura: cfd.dataAbertura,
                    dataFecho: new Date(Date.now()).toLocaleString(),
                    designacao: tipoCFD2Designacao[cfd.tipo] + " " + cfd.ativo,
                    lucroPerda: lucro_perda,
                    percent_lucroPerda: percent_lucro_perda,
                    precoFecho: price,
                    valorAbertura: cfd.valorAbertura,
                    valorInvestido: cfd.montante,
                    customer: payload.customerId
                };

                Cfd
                    .destroyById(cfd.id)
                    .then(() => customer.updateAttribute('saldo', novoSaldo))
                    .then(() => app.models.Movimento.create(movimento))
                    .then(movimento => callback(null, { movimento, novoSaldo }))
                    .catch(error => callback(error))
            })
            .catch(error => callback(error))
    }

    Cfd.remoteMethod(
        'fecharCFD',
        {
            accepts: [
                { arg: 'req', type: 'object', http: { source: 'req' } },
                { arg: 'data', type: 'any', required: true, http: { source: 'body' } },
            ],
            returns: [
                { arg: 'movimento', type: 'object', root: true },
                { arg: 'saldo', type: 'number', root: true },
            ],
            http: { verb: 'post' },
        }
    );


    Cfd.getCfds = function (req, callback) {
        const payload = app.models.Customer.decodeToken(req.headers.authorization);
        if (!payload) {
            return callback(new Error("Sem autorização"));
        }
        Cfd
            .find({ where: { customer: payload.customerId } })
            .then(cfds => callback(null, cfds))
            .catch(error => callback(error));
    }

    Cfd.remoteMethod(
        'getCfds',
        {
            accepts: { arg: 'req', type: 'object', http: { source: 'req' } },
            returns: { arg: 'cfds', type: 'array', root: true },
            http: { verb: 'get' },
        }
    );
};
