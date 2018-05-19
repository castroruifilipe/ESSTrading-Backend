const express = require('express');
const mongoClient = require('mongodb').MongoClient;
const request = require('request-promise-native');
const app = express();
app.use(express.json());

const monguUrl = 'mongodb://localhost:27017';
const dbName = 'quotes';
const collectionName = 'Quote';
const connectionPromise = mongoClient.connect(monguUrl);
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


app.listen(5000, () => console.log('quotes-ms listening on port 5000'));

process.on('exit', () => connectionPromise.then(client => client.close()));