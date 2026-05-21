# Documentação de Regras de Negócio — Vainozap

> **Última atualização:** Maio 2026 | Stack: Angular 17+ / Spring Boot 3.x / PostgreSQL / AWS S3

---

## 1. Visão Geral

O **Vainozap** é uma plataforma SaaS multi-tenant de catálogo digital com pedidos via WhatsApp.
Cada lojista cadastrado recebe sua própria **vitrine pública** acessível por subdomínio
(`{slug}.vainozap.com.br`) e um **painel de gestão** em `app.vainozap.com.br/merchant`.

**Proposta de valor:** pequenos e médios comerciantes montam um catálogo online completo em minutos,
sem precisar de app ou sistema de pagamento próprio — o pedido é finalizado via WhatsApp com o lojista.

**Concorrente direto:** Vendizap.

---

## 2. Arquitetura Geral

```
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND (Angular 17+, Standalone Components, Signals)              │
│                                                                      │
│  vainozap.com.br         → Landing Page                              │
│  app.vainozap.com.br     → Painel do lojista  (/merchant)            │
│  {slug}.vainozap.com.br  → Vitrine pública    (storefront)           │
└──────────────────────────────────────────────────────────────────────┘
                                  │ HTTPS / REST API
┌──────────────────────────────────────────────────────────────────────┐
│  BACKEND (Spring Boot 3.x, Java 21)                                  │
│                                                                      │
│  /api/v1/auth/**           → Autenticação pública                    │
│  /api/v1/merchant/**       → Painel do lojista  (JWT obrigatório)    │
│  /api/v1/storefront/**     → Vitrine pública    (sem JWT)            │
└──────────────────────────────────────────────────────────────────────┘
                                  │
┌──────────────────┐   ┌──────────────────┐   ┌────────────────────────┐
│  PostgreSQL       │   │  AWS S3          │   │  SSE                   │
│  (Flyway V1–V15) │   │  (imagens)       │   │  (notificações live)   │
└──────────────────┘   └──────────────────┘   └────────────────────────┘
```

### 2.1 Roteamento por hostname

| Hostname | Área renderizada |
|---|---|
| `vainozap.com.br` (root) | Landing Page |
| `app.vainozap.com.br` | Painel do lojista (`/merchant`) |
| `{slug}.vainozap.com.br` | Vitrine pública do tenant |
| `localhost` sem `devTenantSlug` | Landing Page (dev) |
| `localhost` com `devTenantSlug` | Vitrine (dev) |

O guard `isRootDomain` detecta o hostname e direciona o Angular Router para o módulo correto.

### 2.2 Isolamento de dados (multi-tenancy)

- Cada requisição autenticada carrega o `tenantId` no JWT
- O `JwtAuthFilter` extrai e injeta o tenant no `TenantContext` (thread-local)
- `CurrentTenantPort` é injetado nos serviços para filtrar todos os queries por `tenantId`
- Storefront usa `X-Tenant-Slug` header ou subdomínio para resolver o tenant sem JWT

---

## 3. Identidade & Autenticação

### 3.1 Cadastro de lojista

```
POST /api/v1/auth/register
```

Fluxo executado pelo `AuthService.register()`:

1. Valida unicidade de `email` e `slug`
2. Cria entidade `User` (senha criptografada com BCrypt)
3. Cria entidade `Tenant` com:
   - `planoTipo = "basico"`
   - `ativo = true`
   - `trialEndsAt = agora + 30 dias`
4. Cria `UserTenant` com papel `PapelUserTenant.OWNER`
5. Gera e retorna `accessToken` (JWT) + `refreshToken`

> **Regra:** um usuário pode ter múltiplas lojas (limitado pelo plano). Ao cadastrar,
> ele já vira OWNER da primeira loja automaticamente.

### 3.2 Login

```
POST /api/v1/auth/login
```

- Retorna `accessToken` (curta duração) + `refreshToken` (longa duração)
- O JWT contém os claims: `tenantId`, `role`, `nomeLoja`, `slug`

### 3.3 Refresh de token

```
POST /api/v1/auth/refresh
```

- Valida o `refreshToken` no banco
- Gera novos tokens com rotação

### 3.4 Estrutura do JWT

```json
{
  "sub": "user-uuid",
  "tenantId": "tenant-uuid",
  "role": "MERCHANT",
  "nomeLoja": "Minha Loja",
  "slug": "minha-loja"
}
```

### 3.5 Papéis globais (Role)

| Role | Acesso |
|---|---|
| `MERCHANT` | Painel do lojista (`/api/v1/merchant/**`) |
| `ADMIN` | Administração da plataforma (não exposto no front ainda) |

### 3.6 Papéis dentro do tenant (PapelUserTenant)

| Papel | Descrição |
|---|---|
| `OWNER` | Dono da loja — criado automaticamente no cadastro |

---

## 4. Planos e Limites

| Plano | Máximo de lojas |
|---|---|
| `basico` | 1 |
| `profissional` | 2 |
| `enterprise` | ilimitado |

- Ao tentar criar uma segunda loja, `PlanoLimites.podeAdicionarLoja()` valida se o plano permite
- **Trial:** 30 dias após cadastro (`trialEndsAt`). Lógica de bloqueio por vencimento
  **ainda não implementada** no backend — campo existe mas a validação está pendente

---

## 5. Catálogo

### 5.1 Modelo de dados

```
Tenant
 └── Category (N)
      └── Product (N)
           ├── fotos: List<String>       (URLs S3)
           ├── ativo: boolean
           ├── semEstoque: boolean
           ├── estoque: Integer          (null se tem variações ou semEstoque=true)
           └── variacoes: List<Variacao>
                └── opcoes: List<OpcaoVariacao>
                     ├── nome
                     ├── precoExtra      (acréscimo ao preço base)
                     ├── estoque         (por opção — quando produto tem variações)
                     └── cor/swatch      (opcional, para seleção visual)
```

### 5.2 Tipos de produto

| Configuração | Comportamento na vitrine |
|---|---|
| `semEstoque = false`, sem variações | Produto simples — estoque numérico, botão "Adicionar ao carrinho" |
| `semEstoque = false`, com variações | Produto com opções — estoque por `OpcaoVariacao`, modal de seleção |
| `semEstoque = true` | Serviço / Consultoria — **sem carrinho**, só botão "Falar no WhatsApp" |

> **Regra crítica:** quando `semEstoque = true`, o produto nunca entra no carrinho.
> O cliente é redirecionado diretamente para o WhatsApp do lojista com mensagem pré-formatada.

### 5.3 Variações e Templates

- `VariacaoTemplate`: modelo reutilizável (ex: "Tamanhos P/M/G", "Cores")
- O lojista cria templates e os aplica nos produtos
- Cada `Variacao` tem `nome`, `tipo` (ex: `COR`, `TAMANHO`) e lista de `OpcaoVariacao`
- `OpcaoVariacao` pode ter `precoExtra` (acréscimo ao preço base) e `estoque` próprio

### 5.4 Cache do catálogo

- O catálogo da vitrine é cacheado via Spring Cache
- Qualquer create/update/delete de produto chama `CatalogCachePort.evictProducts()`
- Garante que mudanças do lojista reflitam imediatamente na vitrine pública

---

## 6. Configurações da Loja

### 6.1 Dados principais do Tenant

| Campo | Descrição |
|---|---|
| `nomeLoja` | Nome exibido na vitrine e no JWT |
| `slug` | Identificador único → subdomínio |
| `slogan` | Frase de destaque |
| `tituloDocumento` | Tag `<title>` da vitrine |
| `logoUrl` | URL S3 do logotipo |
| `faviconUrl` | URL S3 do favicon |
| `bannerUrl` | URL S3 do banner hero da vitrine |
| `corPrimaria`, `corSecundaria`, `corDestaqueCatalogo` | Cores de tema (hex) |
| `whatsapp` | Número para pedidos |
| `emailContato`, `telefoneContato` | Contato exibido no rodapé |
| `horarioAtendimentoLinha` | Resumo de horário (ex: "Seg–Sex 9h–18h") |
| `horarioAtendimentoDetalhes` | Texto completo multi-linha |
| `cnpj`, `nomeProprietario`, `enderecoLinha` | Dados legais no rodapé |

### 6.2 Rodapé (TenantRodape)

Entidade separada com relacionamento `@OneToOne` com Tenant:

| Campo | Descrição |
|---|---|
| `textoLinkWhatsapp` | Texto do botão CTA "Falar no WhatsApp" |
| `seloTitulo`, `seloSubtitulo` | Selo de segurança/confiança |
| `reclamacoesTexto`, `reclamacoesUrl` | Link para Reclame Aqui ou similar |
| `formasPagamento` | Lista de strings (ex: `["PIX", "Cartão de Crédito"]`) |
| `redesSociais` | Lista de `{rotulo, url}` (Instagram, Facebook, etc.) |
| `redesPlaceholder` | Texto quando não há redes sociais cadastradas |
| `faixaInferior` | Faixa cinza "POWERED BY VAINOZAP" |

### 6.3 Endpoint de atualização

```
PUT /api/v1/merchant/settings
Content-Type: multipart/form-data

Parâmetros:
  settings     → JSON stringificado com todos os campos do tenant + rodapé
  logoFile     → File (opcional)
  faviconFile  → File (opcional)
  bannerFile   → File (opcional)
```

> **Regra de imagem:** se um arquivo foi enviado → faz upload no S3 e usa a URL gerada.
> Se não foi enviado → usa a URL que veio no JSON. `null` = remove a imagem do banco.

---

## 7. Vitrine Pública (Storefront)

### 7.1 Rotas

| Rota | Conteúdo |
|---|---|
| `/` | Catálogo com categorias, filtros e lista de produtos |
| `/products/:id` | Página do produto (fotos, variações, botão carrinho / WhatsApp) |
| `/cart` | Carrinho com lista de itens e resumo |
| `/checkout` | Formulário de finalização do pedido |

### 7.2 Carregamento do contexto

Ao acessar qualquer página da vitrine:

1. `StorefrontContextService` busca dados via `GET /api/v1/storefront/tenant`
2. Armazena: `nomeLoja`, `slug`, `logoUrl`, `bannerUrl`, `corPrimaria`, `whatsapp`, rodapé, etc.
3. Aplica as cores customizadas como CSS custom properties no `<body>`

### 7.3 Banner hero

- Exibido no catálogo acima das categorias
- Renderiza **apenas** se `tenant.bannerUrl` estiver preenchido
- Background com a imagem + gradiente escuro + logo + nome da loja + slogan
- Responsivo: 220px mobile → 320px tablet → 400px desktop

### 7.4 Filtros do catálogo

- Filtro por categoria
- Busca por texto (nome do produto)
- Estado gerenciado por `StorefrontFiltersService`

---

## 8. Carrinho

### 8.1 Estrutura de CartLine

```typescript
interface CartLine {
  id: string;         // UUID local (não persiste no banco)
  productId: string;
  titulo: string;     // "Nome do produto — Tamanho M, Cor Azul"
  quantidade: number;
  precoUnit: number;  // preço base + precoExtra da variação selecionada
  thumbUrl?: string;
}
```

### 8.2 Regras do carrinho

- Estado mantido em memória via `signal` — **não persiste entre sessões**
- Um produto com múltiplas variações gera **múltiplas linhas** independentes
- `incrementProductFromCatalog`: 1 linha → incrementa; >1 linha → redireciona para ficha do produto
- `decrementProduct`: remove pela última linha adicionada
- Máximo de 999 unidades por linha
- Produtos com `semEstoque = true` **nunca entram no carrinho**

---

## 9. Checkout e Pedidos

### 9.1 Fluxo completo

```
[Carrinho] → [Formulário Checkout] → POST /api/v1/storefront/orders
                                               │
                                    Salva no banco (status: NOVO)
                                               │
                                    Notifica lojista via SSE
                                               │
                              Redireciona para WhatsApp do lojista
```

### 9.2 Dados do pedido (Order)

```
Order {
  id:        UUID
  tenantId:  UUID
  status:    StatusPedido
  canal:     "ONLINE" | "PRESENCIAL"
  subtotal:  BigDecimal
  cliente: {
    nome, cpfCnpj, telefone, observacoes
  }
  pagamento: {
    forma       (PIX | Dinheiro | Cartão de Crédito | Cartão de Débito | Transferência)
    bandeira    (Visa | Mastercard | ...)
    parcelas
    modoCartao  (CREDITO | DEBITO)
    trocoPara   (para pagamento em dinheiro)
  }
  entrega: {
    modo        (RETIRADA | ENTREGA)
    cep, logradouro, numero, bairro, uf, cidade, complemento
  }
  linhas:    OrderLine[]
  criadoEm:  Instant
}
```

### 9.3 Ciclo de vida (StatusPedido)

```
AGUARDANDO_PAGAMENTO  →  NOVO  →  EM_PREPARO  →  ENVIADO  →  ENTREGUE
         │                │
         └────────────────┴──────────────────────────────→  CANCELADO
                                                            PAGAMENTO_NAO_EFETUADO
```

### 9.4 Canal do pedido

| Canal | Origem |
|---|---|
| `ONLINE` | Pedido feito pelo cliente na vitrine pública |
| `PRESENCIAL` | Pedido criado pelo lojista via PDV |

---

## 10. Notificações em Tempo Real

### 10.1 Mecanismo (SSE)

- **Server-Sent Events**: conexão persistente do painel com o backend
- O frontend mantém a conexão aberta via `EventSource`
- Ao chegar um novo pedido, o backend dispara evento para o tenant correspondente

### 10.2 Estrutura da notificação

```
Notification {
  id:        UUID
  tenantId:  UUID
  tipo:      "NOVO_PEDIDO"
  titulo:    "🛍 Novo pedido — R$ 89,90"
  mensagem:  "Pedido de João Silva"
  lida:      boolean
  pedidoId:  UUID
  criadaEm:  Instant
}
```

### 10.3 Endpoints

| Método | Rota | Ação |
|---|---|---|
| `GET` | `/api/v1/merchant/notifications/stream` | Stream SSE |
| `GET` | `/api/v1/merchant/notifications` | Lista 50 mais recentes |
| `GET` | `/api/v1/merchant/notifications/unread-count` | Contador não lidas |
| `PATCH` | `/api/v1/merchant/notifications/{id}/read` | Marca como lida |
| `PATCH` | `/api/v1/merchant/notifications/read-all` | Marca todas como lidas |

---

## 11. Painel do Lojista (Merchant Panel)

### 11.1 Mapa de rotas

```
/merchant                              → Dashboard (métricas gerais)
/merchant/loja
  ├── /vitrine                         → Preview da vitrine
  ├── /cadastrar
  │    ├── /produtos                   → Formulário de novo produto
  │    ├── /variacoes                  → Templates de variação
  │    └── /categorias                 → Gerenciar categorias
  ├── /configurar                      → Configurações da loja
  └── /gerenciar
       ├── /produtos                   → Lista de produtos (paginada + busca)
       └── /estoque                    → Ajuste rápido de estoque
/merchant/orders
  ├── /pedidos                         → Lista de pedidos (filtros por status)
  ├── /pedidos/:id                     → Detalhe + atualização de status
  ├── /vendas                          → Relatório de vendas
  └── /pdv                             → Venda presencial
/merchant/contas                       → Conta e plano
```

### 11.2 Seções em destaque

- **Dashboard:** totalizadores — pedidos hoje, faturamento, produtos ativos, pedidos aguardando
- **Produtos:** CRUD completo com fotos (S3), categorias, variações, preço, estoque, ativo/inativo, `semEstoque`
- **Estoque:** ajuste rápido sem abrir o formulário completo do produto
- **Pedidos:** lista, filtros por status, atualização de status, detalhe do cliente e entrega
- **PDV:** criar pedido presencial (canal = `PRESENCIAL`)
- **Configurar:** identidade, cores, banner, contato, horário, rodapé, redes sociais

---

## 12. Infraestrutura de Dados (Flyway Migrations)

| Migration | Conteúdo |
|---|---|
| V1 | Tabela `tenants` |
| V2 | Catálogo — `categories`, `products`, `product_fotos`, `variacoes`, `opcao_variacoes` |
| V3 | Pedidos — `orders`, `order_lines` |
| V4 | Identidade — `users`, `refresh_tokens` |
| V6 | Remove colunas órfãs de pedidos |
| V7 | Templates de variação |
| V8 | Altera colunas de swatch para varchar |
| V9 | Adiciona `sem_estoque` em `products` |
| V10 | Adiciona `estoque` em `products` e `opcao_variacoes` |
| V11 | Tabela `user_tenants` (suporte multi-loja) |
| V12 | Tabela `notifications` |
| V13 | Adiciona `trial_ends_at` em `tenants` |
| V14 | Adiciona `canal` em `orders` |
| V15 | Adiciona `banner_url` em `tenants` |

---

## 13. Mídia — AWS S3

- Serviço: `MediaStorageService.save(List<MultipartFile> files, UUID tenantId) → List<String> urls`
- Organização no bucket: pasta por `tenantId`
- Formatos aceitos: JPEG, PNG, WebP
- Usado para: logo, favicon, banner, fotos de produto

---

## 14. Segurança

| Aspecto | Implementação |
|---|---|
| Autenticação | JWT Bearer — `Authorization: Bearer {token}` |
| Filtro | `JwtAuthFilter` — valida em toda requisição `/api/v1/merchant/**` |
| Senhas | BCrypt |
| Isolamento multi-tenant | `CurrentTenantPort` filtra todos os queries por `tenantId` |
| Endpoints públicos | `/api/v1/auth/**` e `/api/v1/storefront/**` — sem JWT |

---

## 15. Stack Tecnológica

### Backend
- Java 21 + Spring Boot 3.x
- Spring Security (JWT)
- Spring Data JPA + PostgreSQL
- Flyway (migrações de banco)
- Spring Cache (catálogo)
- SSE — Server-Sent Events (notificações)
- AWS S3 SDK (imagens)
- Lombok, Jackson, Hibernate Validator
- Swagger / OpenAPI (Springdoc)

### Frontend
- Angular 17+ (Standalone Components)
- Signals API — `signal`, `computed`, `effect`, `toSignal`
- Angular Router (lazy loading por feature)
- Reactive Forms
- BEM + CSS Custom Properties (theming)
- `:host-context()` para temas baseados em classe ancestral

---

## 16. Roadmap — Funcionalidades Não Implementadas

> Rotas existem comentadas no código fonte — indicam o planejamento futuro:

| Feature | Status |
|---|---|
| Interessados / Leads | Rota comentada no router |
| Clientes (lista, avaliações, carrinho abandonado) | Rota comentada no router |
| Equipe (múltiplos usuários por loja) | Rota comentada no router |
| Planos (página de upgrade) | Rota comentada no router |
| FAQ / Ajuda | Rota comentada no router |
| Pix recebidos | Rota comentada no router |
| Integração Reclame Aqui | Parcialmente no rodapé |
| Bloqueio por vencimento de trial | Campo existe, lógica pendente |
| Notificações por push / e-mail | Somente SSE no momento |
