FROM node:latest

#RUN npm i npm@latest -g
RUN npm i nodemon -g
#RUN npm install grpc

RUN mkdir /usr/src/api
WORKDIR /usr/src/api

#ENV PATH /usr/src/api/node_modules/.bin:$PATH

ADD package.json /usr/src/api/package.json
RUN npm install

ADD nodemon.json /usr/src/api/nodemon.json

EXPOSE 3000

CMD ["npm", "run" ,"start"]