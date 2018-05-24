const express = require('express');
const mongoClient = require('mongodb').MongoClient;
const request = require('request-promise-native');
const socketIO = require('socket.io')();

const app = express();
app.use(express.json());


const mongoUrl = 'mongodb://mongo:27017';
const dbName = 'quotes';
const collectionName = 'Quote';
const connectionPromise = mongoClient.connect(mongoUrl, { useNewUrlParser: true });
const quoteCollection = connectionPromise
    .then(client => client.db(dbName))
    .then(db => db.collection(collectionName));


app.get('/quotes-ms/quotes', (req, res) => {
    quoteCollection
        .then(col => col.find({}).toArray())
        .then(list => res.send(list))
        .catch(error => {
            res.status(500);
            res.send(error);
        });
});



socketIO.on('connection', function (socket) {
    console.log("AQUI");
    socket.emit('news', { hello: 'world' });
    socket.on('message', function (data) {
        console.log(data);
    });
});


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
        .then(quotes => Promise.all([quotes, quoteCollection]))
        .then(([quotes, quoteCollection]) => (
            Promise.all(quotes.map(quote => {
                if (quote.bidPrice * quote.askPrice == 0) {
                    //return;
                }
                return quoteCollection.update(
                    { symbol: quote.symbol },
                    { $set: { askPrice: quote.askPrice, bidPrice: quote.bidPrice } },
                    { upsert: true },
                    (error, commandResult) => {
                        if (error) {
                            throw error;
                        }
                        if (commandResult.result.nModified === 1) {
                            socketIO.emit('quote', quote);
                        }
                    }
                );
            }))
        ))
        .catch(error => console.error(error));
}

const _timeout = setInterval(getQuotes, 3000);

app.listen(5000, () => console.log('Quotes microservice listening on port 5000'));
socketIO.listen(8000);
console.log('Quotes socket listening on port 8000')

process.on('exit', () => {
    connectionPromise.then(client => client.close());
    clearTimeout(_timeout);
})