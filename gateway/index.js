const express = require('express');
const proxy = require('http-proxy-middleware');

const app = express();

app.use('/quotes-ms', proxy('/quotes-ms', { target: 'http://localhost:5000', changeOrigin: true }));
app.use('/api', proxy('/api', { target: 'http://localhost:3000', changeOrigin: true }))

app.listen(9000, () => console.log('Gateway listening on port 9000'))