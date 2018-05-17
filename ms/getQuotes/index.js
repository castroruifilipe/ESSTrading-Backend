const IEXClient = require('iex-api').IEXClient;



const mongoClient = require('mongodb').MongoClient;
const request = require('request-promise-native');


const monguUrl = 'mongodb://localhost:27017';
const dbName = 'quotes';
const collectionName = 'Quote';
const connectionPromise = mongoClient.connect(monguUrl);
const quoteCollection = connectionPromise
    .then(client => client.db(dbName))
    .then(db => db.collection(collectionName));


const symbols = ['AMZN', 'AAPL'];

function getQuotes() {
    symbols.forEach(symbol => {
        request({
            url: `https://api.iextrading.com/1.0/stock/${symbol}/quote`,
            json: true,
        })
            .then(quote => {
                console.log(quote)
            })
            .catch(error => console.error(error));
    })
}

const _timeout = setInterval(getQuotes, 3000);


process.on('exit', () => {
    connectionPromise.then(client => client.close());
    clearTimeout(_timeout);
})