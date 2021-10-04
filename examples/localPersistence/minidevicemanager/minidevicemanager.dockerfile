FROM node:12.18-alpine AS base

WORKDIR /opt/mini-device-manager

COPY examples/localPersistence/minidevicemanager/package.json package.json
COPY examples/localPersistence/minidevicemanager/package-lock.json package-lock.json

COPY package.json dojot/package.json
COPY npm-shrinkwrap.json dojot/npm-shrinkwrap.json

RUN apk --no-cache add \
    bash \
    g++ \
    ca-certificates \
    lz4-dev \
    musl-dev \
    cyrus-sasl-dev \
    openssl-dev \
    make \
    python

RUN apk add --no-cache --virtual .build-deps \
    gcc \
    zlib-dev \
    libc-dev \
    bsd-compat-headers \
    py-setuptools \
    bash

RUN npm install --only=prod

WORKDIR /opt/mini-device-manager/dojot
RUN npm install --only=prod

FROM base

WORKDIR /opt/mini-device-manager
COPY examples/localPersistence/minidevicemanager/src ./src
COPY lib ./dojot/lib
COPY index.js ./dojot/index.js

CMD ["npm", "run", "start"]
