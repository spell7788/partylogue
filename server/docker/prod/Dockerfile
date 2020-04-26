FROM node:lts-alpine as build-stage

WORKDIR /app

COPY package*.json yarn.lock tsconfig.json ./

RUN npm install typescript --no-save --no-package-lock

COPY . .

RUN ./node_modules/.bin/tsc \
    && rm -rf node_modules

# ---

FROM node:lts-alpine as production-stage

WORKDIR /app

COPY --from=build-stage /app .

RUN yarn install --frozen-lockfile

EXPOSE 80

CMD [ "yarn", "start" ]
