# ─── Stage 1: Build Angular ──────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Copia manifesto primeiro — aproveita cache de node_modules
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copia código e gera build de produção
COPY . .
RUN npm run build -- --configuration=production

# ─── Stage 2: Servir com nginx ───────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copia o build do Angular (Angular 21 gera em dist/<project-name>/browser)
COPY --from=build /app/dist/saas/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
