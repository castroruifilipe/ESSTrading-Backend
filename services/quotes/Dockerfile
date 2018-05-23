FROM node:latest

#RUN npm i npm@latest -g
RUN npm i nodemon -g
#RUN npm install grpc

RUN mkdir -p /usr/src/services/quotes
WORKDIR /usr/src/services/quotes

ADD package.json /usr/src/services/quotes/package.json
RUN npm install

ADD nodemon.json /usr/src/services/quotes/nodemon.json

EXPOSE 5000

EXPOSE 5001

CMD ["npm", "run", "start"]