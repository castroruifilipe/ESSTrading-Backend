const express = require('express');
const cors = require('cors');
const proxy = require('http-proxy-middleware');

const app = express();
app.use(cors({credentials: true, origin: 'http://localhost:3000'}));

app.use('/socket.io', proxy('/socket.io', { target: 'http://get_quotes:8000', changeOrigin: true, ws: true }));
app.use('/quotes-ms', proxy('/quotes-ms', { target: 'http://quotes:5000', changeOrigin: true }));
app.use('/api', proxy('/api', { target: 'http://api:3000', changeOrigin: true }))

app.listen(9000, () => console.log('Gateway listening on port 9000'))