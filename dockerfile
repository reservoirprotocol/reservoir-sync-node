FROM node:18 AS build

WORKDIR /app

COPY package.json contracts.txt ./

RUN npm install

COPY . .

RUN npm run build
RUN npm run build:viewer

FROM node:18-slim AS production

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/.env ./

RUN npm install --production

COPY --from=build /app/dist ./dist
COPY --from=build /app/contracts.txt ./dist/contracts.txt

RUN npm run database:prepare

EXPOSE 3000

CMD ["node", "dist/index.js"]
