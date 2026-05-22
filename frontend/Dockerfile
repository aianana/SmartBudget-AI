FROM node:22-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
ARG CACHEBUST=1
RUN npm run build
EXPOSE 4173
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
