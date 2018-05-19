FROM node:latest

#RUN npm i npm@latest -g
RUN npm i nodemon -g
#RUN npm install grpc

RUN mkdir /usr/src/gateway
WORKDIR /usr/src/gateway

ADD package.json /usr/src/gateway/package.json
RUN npm install

ADD nodemon.json /usr/src/gateway/nodemon.json

EXPOSE 9000

CMD ["npm", "run", "start"]