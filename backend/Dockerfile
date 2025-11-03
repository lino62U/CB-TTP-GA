# Etapa 1: Construcción
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Generar cliente Prisma
RUN npx prisma generate

# Etapa 2: Ejecución
FROM node:20-alpine

WORKDIR /usr/src/app

# --- 🔧 Instalar Python 3 y dependencias necesarias ---
RUN apk add --no-cache python3 py3-pip

COPY --from=build /usr/src/app ./

EXPOSE 8000

# Ejecuta el servidor con nodemon en desarrollo
CMD ["npm", "run", "dev"]
