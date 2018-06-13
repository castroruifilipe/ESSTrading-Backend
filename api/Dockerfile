FROM node:latest

RUN npm i npm@latest -g
RUN npm i nodemon -g

ADD package.json /install/
WORKDIR /install/
RUN npm install --verbose
ENV NODE_PATH=/install/node_modules

RUN mkdir /usr/src/api
WORKDIR /usr/src/api/

ADD nodemon.json /usr/src/api/nodemon.json

EXPOSE 3000

CMD ["npm", "run" ,"start"]