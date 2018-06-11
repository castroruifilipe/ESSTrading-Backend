const express = require('express');
const mongoClient = require('mongodb').MongoClient;
const request = require('request-promise-native');
const socketIO = require('socket.io')();

const app = express();
app.use(express.json());

const mongoUrl = 'mongodb://ess:esstrading2018@ds155730.mlab.com:55730';
const dbName = 'quotes';
const collectionName = 'Quote';
const connectionPromise = mongoClient.connect(mongoUrl, { useNewUrlParser: true });
const quoteCollection = connectionPromise
    .then(client => client.db(dbName))
    .then(db => db.collection(collectionName));


const adapter = (iexQuote) => {
    return ({
        symbol: iexQuote.symbol,
        companyName: iexQuote.companyName,
        bidPrice: iexQuote.iexBidPrice,
        askPrice: iexQuote.iexAskPrice,
        changePercent: iexQuote.changePercent,
        change: iexQuote.change,
    })
}


app.get('/quotes-ms/quotes', (req, res) => {
    quoteCollection
        .then(col => col.find({}).toArray())
        .then(list => res.send(list))
        .catch(error => {
            res.status(500);
            res.send(error);
        });
});


app.get('/quotes-ms/quote/:symbol', (req, res) => {
    let symbol = req.params.symbol;
    request({
        url: `https://api.iextrading.com/1.0/stock/${symbol}/quote`,
        json: true,
    })
        .then(quote => {
            if (quote.iexBidPrice && quote.iexAskPrice) {
                res.send(adapter(quote));
            } else {
                quoteCollection
                    .then(col => col.findOne({ symbol }))
                    .then(quote => res.send(quote))
                    .catch(error => {
                        res.status(500);
                        res.send(error);
                    });
            }
        })
        .catch(error => {
            res.status(500);
            res.send(error);
        });
})


let symbols = ['AMZN', 'AAPL', 'FB', 'GOOG', 'TSLA', 'EA', 'HPQ', 'IBM', 'MSFT', 'MSI', 'NOK', 'NVDA', 'ORCL', 'SNAP', 'TRIP'];

function getQuotes() {
    request({
        url: `https://api.iextrading.com/1.0/stock/market/batch?symbols=${symbols}&types=quote`,
        json: true,
    })
        .then(response => Object.values(response).map(adapter))
        .then(quotes => Promise.all([quotes, quoteCollection]))
        .then(([quotes, quoteCollection]) => (
            Promise.all(quotes.map(quote => {
                let newQuote = {
                    companyName: quote.companyName,
                    changePercent: quote.changePercent,
                    change: quote.change,
                }
                if (quote.bidPrice && quote.askPrice) {
                    newQuote['askPrice'] = quote.askPrice;
                    newQuote['bidPrice'] = quote.bidPrice;
                }
                return quoteCollection.update(
                    { symbol: quote.symbol },
                    { $set: { ...newQuote } },
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

app.listen(process.env.PORT_M || 5000, () => console.log('Quotes microservice listening'));
socketIO.listen(process.env.PORT_S || 8000);
console.log('Quotes socket listening');

process.on('exit', () => {
    connectionPromise.then(client => client.close());
    clearTimeout(_timeout);
})