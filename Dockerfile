FROM node:22-alpine as build
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:22-alpine as production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/src/generated/prisma ./dist/generated/prisma
CMD ["node", "dist/src/main.js"]