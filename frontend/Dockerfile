# Etapa 1: Construcción
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Construir la aplicación (si es modo producción)
RUN npm run build

# Etapa 2: Ejecución (modo desarrollo con hot reload)
FROM node:20-alpine

WORKDIR /usr/src/app
COPY --from=build /usr/src/app ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
