FROM node:latest

RUN npm i npm@latest -g
RUN npm i nodemon -g

ADD package.json /install/
WORKDIR /install/
RUN npm install --verbose
ENV NODE_PATH=/install/node_modules

RUN mkdir /usr/src/gateway
WORKDIR /usr/src/gateway

ADD nodemon.json /usr/src/gateway/nodemon.json

EXPOSE 9000

CMD ["npm", "run", "start"]