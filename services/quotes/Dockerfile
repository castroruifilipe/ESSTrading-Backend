FROM node:latest

RUN npm i npm@latest -g
RUN npm i nodemon -g

ADD package.json /install/
WORKDIR /install/
RUN npm install --verbose
ENV NODE_PATH=/install/node_modules

RUN mkdir -p /usr/src/services/quotes
WORKDIR /usr/src/services/quotes

ADD nodemon.json /usr/src/services/quotes/nodemon.json

EXPOSE 5000
EXPOSE 8000

CMD ["npm", "run", "start"]