FROM node:16.13.0-alpine
COPY login-server/auth/ /app/auth/
COPY login-server/db/ /app/db/
COPY login-server/package.json /app/package.json
COPY login-server/package-lock.json /app/package-lock.json
COPY login-server/server.js /app/server.js
COPY cert.crt /app/cert.crt
COPY cert.key /app/cert.key
COPY /frontend/public/ /tmp/public/
COPY /frontend/src/ /tmp/src/
COPY /frontend/package.json /tmp/package.json
COPY /frontend/package-lock.json /tmp/package-lock.json
COPY /frontend/tsconfig.json /tmp/tsconfig.json
RUN cd /tmp \
    && npm ci \
    && npm run build \
    && mv /tmp/build /app/frontend \
    && rm -rf /tmp/*
RUN cd /app \
    && npm ci
EXPOSE 4000
WORKDIR /app
CMD ["node", "server.js"]
