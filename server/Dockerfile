FROM node:lts-alpine as build-stage

WORKDIR /app

COPY package*.json yarn.lock tsconfig.json ./

RUN yarn install --frozen-lockfile

COPY . .

RUN ./node_modules/.bin/tsc

# ---

FROM node:lts-alpine as production-stage

WORKDIR /app

COPY --from=build-stage /app .

RUN yarn install --frozen-lockfile

EXPOSE 8000

CMD [ "yarn", "start" ]
