FROM node:lts-alpine

ENV NODE_ENV development

WORKDIR /app

COPY package*.json yarn.lock ./

RUN yarn install --frozen-lockfile \
    && yarn cache clean

COPY . .

EXPOSE 8080

CMD [ "yarn", "serve" ]
