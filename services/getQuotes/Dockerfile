FROM node:latest

#RUN npm i npm@latest -g
RUN npm i nodemon -g
#RUN npm install grpc

RUN mkdir -p /usr/src/services/getQuotes
WORKDIR /usr/src/services/getQuotes

ADD package.json /usr/src/services/getQuotes/package.json
RUN npm install

ADD nodemon.json /usr/src/services/getQuotes/nodemon.json

CMD ["npm", "run", "start"]