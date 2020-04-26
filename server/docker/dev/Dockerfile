FROM node:lts-alpine

WORKDIR /app

COPY package*.json yarn.lock ./

RUN yarn install --dev --frozen-lockfile \
    && yarn cache clean

COPY . .

EXPOSE 8000

CMD [ "yarn", "run", "start:dev" ]
