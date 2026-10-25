FROM node:20-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY package*.json ./
RUN npm ci --ignore-scripts --omit=dev

COPY src ./src
RUN chown -R app:app /app

USER app
EXPOSE 8080
CMD ["npm", "start"]
