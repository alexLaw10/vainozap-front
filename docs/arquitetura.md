# Arquitetura do Sistema — Vainozap

> Gerado em Maio 2026

---

## Diagrama Geral

```mermaid
graph TD
    %% ── Usuários ─────────────────────────────────────────────────────
    UA(["👤 Cliente\n(vitrine)"])
    UL(["👤 Lojista\n(painel)"])
    UD(["👨‍💻 Dev\n(local)"])

    %% ── DNS ─────────────────────────────────────────────────────────
    DNS["🌐 DNS\nvainozap.com.br\n*.vainozap.com.br\napp.vainozap.com.br"]

    %% ── EC2 (servidor único) ─────────────────────────────────────────
    subgraph EC2["🖥️  AWS EC2 (servidor único)"]
        NGINX["⚙️  Nginx\n─────────────────\n• Serve /var/www/vainozap (Angular)\n• Proxy /api/* → :8080\n• client_max_body_size 30m"]

        subgraph ANGULAR["📦 Frontend — Angular 17+"]
            LP["Landing Page\nvainozap.com.br"]
            SF["Storefront\n{slug}.vainozap.com.br"]
            MP["Merchant Panel\napp.vainozap.com.br"]
        end

        API["☕ Spring Boot API\n(systemd: saas-api)\nporta 8080\nprofile: prod"]
    end

    %% ── Serviços AWS externos ────────────────────────────────────────
    subgraph AWS["☁️  AWS us-east-2"]
        S3["🪣 S3\nsaas-media-prod\n─────────────\nlogo · favicon\nbanner · fotos"]
        RDS[("🗄️  PostgreSQL\n(RDS ou local)\nsaasdb")]
        REDIS[("⚡ Redis\n(ElastiCache ou local)\nCache do catálogo")]
    end

    %% ── Infra de apoio ───────────────────────────────────────────────
    SMTP["📧 SMTP\nGmail / SES\n(reset de senha)"]

    %% ── CI/CD ────────────────────────────────────────────────────────
    subgraph CICD["🔄 CI/CD — GitHub Actions"]
        GH_BACK["vainozap-back\n────────────\n1. mvn test\n2. mvn package\n3. scp JAR → EC2\n4. systemctl restart saas-api"]
        GH_FRONT["vainozap-front\n────────────\n1. npm test\n2. ng build --prod\n3. scp dist/ → EC2\n4. nginx reload"]
    end

    GH["GitHub\nmain branch"]

    %% ── Fluxos ───────────────────────────────────────────────────────
    UA -->|"*.vainozap.com.br"| DNS
    UL -->|"app.vainozap.com.br"| DNS
    DNS --> NGINX

    NGINX -->|"serve static"| ANGULAR
    NGINX -->|"proxy_pass :8080"| API

    API --> RDS
    API --> REDIS
    API -->|"upload imagens"| S3
    API --> SMTP

    UD -->|git push main| GH
    GH --> GH_BACK
    GH --> GH_FRONT
    GH_BACK -->|"SCP JAR + SSH restart"| EC2
    GH_FRONT -->|"SCP dist/ + nginx reload"| EC2
```

---

## Fluxo de uma Requisição — Vitrine Pública

```mermaid
sequenceDiagram
    participant B as 🌐 Browser<br/>(slug.vainozap.com.br)
    participant N as ⚙️ Nginx (EC2)
    participant A as ☕ Spring Boot
    participant R as ⚡ Redis
    participant DB as 🗄️ PostgreSQL
    participant S3 as 🪣 S3

    B->>N: GET slug.vainozap.com.br
    N-->>B: index.html (Angular SPA)

    B->>N: GET /api/v1/storefront/tenant
    N->>A: proxy_pass :8080
    A->>DB: SELECT * FROM tenants WHERE slug=...
    A-->>B: TenantResponse (nome, cores, logo, banner...)

    B->>N: GET /api/v1/storefront/catalog
    N->>A: proxy_pass :8080
    A->>R: GET cache["catalog:{tenantId}"]
    alt cache hit
        R-->>A: produtos em cache
    else cache miss
        A->>DB: SELECT products, categories...
        DB-->>A: dados
        A->>R: SET cache (TTL 5min)
    end
    A-->>B: CatalogResponse

    B->>N: POST /api/v1/storefront/orders
    N->>A: proxy_pass :8080
    A->>DB: INSERT INTO orders...
    A-->>B: OrderResponse {id}
    A--)B: SSE → notifica lojista
```

---

## Fluxo de Deploy (CI/CD)

```mermaid
sequenceDiagram
    participant D as 👨‍💻 Dev
    participant GH as GitHub (main)
    participant GA as GitHub Actions
    participant EC2 as AWS EC2

    D->>GH: git push main
    GH->>GA: trigger workflow

    par Backend
        GA->>GA: mvn test
        GA->>GA: mvn clean package
        GA->>EC2: scp saas-api.jar
        GA->>EC2: systemctl restart saas-api
        EC2-->>GA: health check /actuator/health ✅
    and Frontend
        GA->>GA: npm test
        GA->>GA: ng build --configuration=production
        GA->>EC2: scp dist/ → /var/www/vainozap
        GA->>EC2: nginx -t && systemctl reload nginx
        EC2-->>GA: curl localhost ✅
    end

    GA-->>D: Deploy concluído ✅
```

---

## Fluxo de Upload de Imagens

```mermaid
sequenceDiagram
    participant L as 👤 Lojista (browser)
    participant N as ⚙️ Nginx
    participant A as ☕ Spring Boot
    participant S3 as 🪣 AWS S3

    L->>N: PUT /api/v1/merchant/settings<br/>multipart/form-data<br/>(settings JSON + logoFile + bannerFile)
    Note over N: client_max_body_size 30m ✅
    N->>A: proxy_pass :8080
    Note over A: max-request-size: 30MB ✅
    A->>S3: upload logo → saas-media-prod/{tenantId}/...
    S3-->>A: URL pública
    A->>S3: upload banner → saas-media-prod/{tenantId}/...
    S3-->>A: URL pública
    A->>A: salva URLs no banco
    A-->>L: TenantApiResponse (com novas URLs)
```

---

## Stack Resumida

| Camada | Tecnologia |
|---|---|
| **Frontend** | Angular 17+, Standalone Components, Signals |
| **Servidor web** | Nginx (proxy reverso + serve estático) |
| **Backend** | Spring Boot 3.x, Java 21, systemd |
| **Banco de dados** | PostgreSQL (Flyway V1–V15) |
| **Cache** | Redis (Spring Cache, TTL 5min) |
| **Armazenamento** | AWS S3 (`saas-media-prod`, us-east-2) |
| **E-mail** | SMTP Gmail / SES |
| **Notificações** | SSE — Server-Sent Events |
| **CI/CD** | GitHub Actions → SCP → EC2 |
| **Infraestrutura** | AWS EC2 (instância única) |
| **Auth** | JWT (access + refresh tokens, BCrypt) |
