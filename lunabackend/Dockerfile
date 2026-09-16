FROM node:24-slim AS base
ENV NODE_ENV=production
ENV DATABASE_URL="file:./prisma/dev.db"
WORKDIR /app

COPY luna/package*.json ./luna/
COPY luna/prisma ./luna/prisma
COPY luna/next.config.ts ./luna/
COPY luna/tsconfig.json ./luna/
COPY luna/postcss.config.mjs ./luna/
COPY luna/next-env.d.ts ./luna/
COPY luna/eslint.config.mjs ./luna/
COPY luna/app ./luna/app
COPY luna/lib ./luna/lib
COPY luna/public ./luna/public
COPY luna/.gitignore ./luna/
COPY luna/AGENTS.md ./luna/
COPY luna/CLAUDE.md ./luna/
COPY luna/NETWORK_SETUP.md ./luna/
COPY luna/PROJECT_TZ.md ./luna/
COPY luna/README.md ./luna/

RUN npm ci --prefix ./luna
RUN npx prisma generate --schema ./luna/prisma/schema.prisma
RUN npm run build --prefix ./luna

EXPOSE 3000

CMD ["sh", "-c", "cd /app/luna && npx prisma db push --schema ./prisma/schema.prisma && npm run start -- --hostname 0.0.0.0 --port 3000"]
