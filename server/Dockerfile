# base
FROM node:18
# workung directory
WORKDIR /usr/src/app
# copy
COPY package*.json ./
# command run to the node
RUN npm install

COPY . .
# port
EXPOSE 3001
# command to run the app
CMD ["node", "server.js"]