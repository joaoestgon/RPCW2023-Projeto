FROM node:20-bullseye
WORKDIR /app
COPY logs.json .
RUN npm i -g json-server
EXPOSE 42369
CMD ["json-server","-H","0.0.0.0","logs.json"]