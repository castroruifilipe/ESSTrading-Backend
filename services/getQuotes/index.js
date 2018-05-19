const mongoClient = require('mongodb').MongoClient;
const request = require('request-promise-native');

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


process.on('exit', () => {
    connectionPromise.then(client => client.close());
    clearTimeout(_timeout);
})