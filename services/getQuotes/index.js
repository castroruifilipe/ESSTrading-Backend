const mongoClient = require('mongodb').MongoClient;
const request = require('request-promise-native');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const admin = require('firebase-admin');

var serviceAccount = require('./ess-trading-firebase-adminsdk-a6j28-14f8da65dd.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://ess-trading.firebaseio.com'
});

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = socketIO(server);

const mongoUrl = 'mongodb://mongo:27017';
const dbName = 'quotes';
const collectionName = 'Quote';
const connectionPromise = mongoClient.connect(mongoUrl);
const quoteCollection = connectionPromise
    .then(client => client.db(dbName))
    .then(db => db.collection(collectionName));

let symbols = ['AMZN', 'AAPL', 'FB', 'GOOG', 'TSLA', 'EA', 'HPQ', 'IBM', 'MSFT', 'MSI', 'NOK', 'NVDA', 'ORCL', 'SNAP', 'TRIP'];

function getQuotes() {
    request({
        url: `https://api.iextrading.com/1.0/stock/market/batch?symbols=${symbols}&types=quote`,
        json: true,
    })
        .then(response =>
            Object.values(response).map(r => ({
                symbol: r.quote.symbol,
                bidPrice: r.quote.iexBidPrice,
                askPrice: r.quote.iexAskPrice,
            }))
        )
        .then(quotes => Promise.all([
            quotes,
            quoteCollection,
        ]))
        .then(([quotes, quoteCollection]) => (
            Promise.all(quotes.map(quote => quoteCollection.update(
                { symbol: quote.symbol },
                quote,
                { upsert: true }
            )))
        ))
        .catch(error => console.error(error));
}

const _timeout = setInterval(getQuotes, 3000);


// io.use(socket => {
//     if (socket.handshake.query && socket.handshake.query.token) {
//         const token = socket.handshake.query.token;
//     }
// })

io.on('connection', socket => {
    console.log('User connected')
    console.log("token: " + socket.handshake.query.token);
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
})


server.listen(8000, () => console.log('socket listening on port 8000'));


process.on('exit', () => {
    connectionPromise.then(client => client.close());
    clearTimeout(_timeout);
})