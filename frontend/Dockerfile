FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY .npmrc .npmrc

RUN npm install
RUN npm install -g @angular/cli

COPY . .

EXPOSE 4200

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
