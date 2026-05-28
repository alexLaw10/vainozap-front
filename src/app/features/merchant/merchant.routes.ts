import { Routes } from '@angular/router';

import { MerchantShellComponent } from './components/merchant-shell/merchant-shell.component';

/**
 * Merchant — URLs absolutas
 * | Path | Conteúdo |
 * |------|----------|
 * | `/merchant` | Dashboard |
 * | `/merchant/loja/vitrine` | Vitrine |
 * | `/merchant/loja/cadastrar/*` | Cadastros |
 * | `/merchant/loja/configurar` | Configurações |
 * | `/merchant/loja/gerenciar/*` | Gestão |
 * | `/merchant/orders/pedidos` | Lista de pedidos |
 * | `/merchant/orders/vendas` | Vendas |
 * | `/merchant/contas` | Contas |
 *
 * NÃO IMPLEMENTADOS (comentados):
 *   /merchant/loja/gerenciar/interessados
 *   /merchant/orders/clientes/*
 *   /merchant/orders/painel
 *   /merchant/contas/equipe | ajuda | faq | planos | reclamacoes | ponto-de-venda | pix-recebidos
 */
export const MERCHANT_ROUTES: Routes = [
  {
    path: '',
    component: MerchantShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/dashboard/merchant-dashboard-page/merchant-dashboard-page.component').then(
            (m) => m.MerchantDashboardPageComponent,
          ),
        data: { title: 'Início' },
      },
      {
        path: 'products',
        pathMatch: 'full',
        redirectTo: 'loja/gerenciar/produtos',
      },
      { path: 'cadastrar',              pathMatch: 'full', redirectTo: 'loja/cadastrar/produtos' },
      { path: 'cadastrar/produtos',     pathMatch: 'full', redirectTo: 'loja/cadastrar/produtos' },
      { path: 'cadastrar/variacoes',    pathMatch: 'full', redirectTo: 'loja/cadastrar/variacoes' },
      { path: 'cadastrar/categorias',   pathMatch: 'full', redirectTo: 'loja/cadastrar/categorias' },
      { path: 'configurar',             pathMatch: 'full', redirectTo: 'loja/configurar' },
      { path: 'gerenciar',              pathMatch: 'full', redirectTo: 'loja/gerenciar/produtos' },
      { path: 'gerenciar/produtos',     pathMatch: 'full', redirectTo: 'loja/gerenciar/produtos' },
      { path: 'gerenciar/estoque',      pathMatch: 'full', redirectTo: 'loja/gerenciar/estoque' },
      // { path: 'gerenciar/interessados', pathMatch: 'full', redirectTo: 'loja/gerenciar/interessados' }, // NÃO IMPLEMENTADO
      {
        path: 'loja',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'vitrine' },
          {
            path: 'vitrine',
            loadComponent: () =>
              import('./pages/loja/merchant-vitrine-page/merchant-vitrine-page.component').then(
                (m) => m.MerchantVitrinePageComponent,
              ),
            data: { title: 'Vitrine' },
          },
          {
            path: 'cadastrar',
            children: [
              { path: '', pathMatch: 'full', redirectTo: 'produtos' },
              {
                path: 'produtos',
                loadComponent: () =>
                  import('./pages/loja/merchant-product-form-page/merchant-product-form-page.component').then(
                    (m) => m.MerchantProductFormPageComponent,
                  ),
                data: { title: 'Novo produto' },
              },
              {
                path: 'variacoes',
                loadComponent: () =>
                  import('./pages/loja/merchant-variacao-templates-page/merchant-variacao-templates-page.component').then(
                    (m) => m.MerchantVariacaoTemplatesPageComponent,
                  ),
                data: { title: 'Modelos de Variação' },
              },
              {
                path: 'categorias',
                loadComponent: () =>
                  import('./pages/loja/merchant-categories-page/merchant-categories-page.component').then(
                    (m) => m.MerchantCategoriesPageComponent,
                  ),
                data: { title: 'Categorias' },
              },
            ],
          },
          {
            path: 'configurar',
            loadComponent: () =>
              import('./pages/loja/merchant-configurar-page/merchant-configurar-page.component').then(
                (m) => m.MerchantConfigurarPageComponent,
              ),
            data: { title: 'Configurar loja' },
          },
          {
            path: 'gerenciar',
            children: [
              { path: '', pathMatch: 'full', redirectTo: 'produtos' },
              {
                path: 'produtos',
                loadComponent: () =>
                  import('./pages/loja/merchant-products-page/merchant-products-page.component').then(
                    (m) => m.MerchantProductsPageComponent,
                  ),
                data: { title: 'Produtos' },
              },
              {
                path: 'produtos/:id/editar',
                loadComponent: () =>
                  import('./pages/loja/merchant-product-form-page/merchant-product-form-page.component').then(
                    (m) => m.MerchantProductFormPageComponent,
                  ),
                data: { title: 'Editar produto' },
              },
              {
                path: 'estoque',
                loadComponent: () =>
                  import('./pages/loja/merchant-estoque-page/merchant-estoque-page.component').then(
                    (m) => m.MerchantEstoquePageComponent,
                  ),
                data: { title: 'Estoque' },
              },
              {
                path: 'cupons',
                loadComponent: () =>
                  import('./pages/loja/merchant-cupons-page/merchant-cupons-page.component').then(
                    (m) => m.MerchantCuponsPageComponent,
                  ),
                data: { title: 'Cupons de desconto' },
              },
              // NÃO IMPLEMENTADO — /merchant/loja/gerenciar/interessados
              // {
              //   path: 'interessados',
              //   loadComponent: () =>
              //     import('./pages/contas/merchant-placeholder-page/merchant-placeholder-page.component').then(
              //       (m) => m.MerchantPlaceholderPageComponent,
              //     ),
              //   data: { title: 'Interessados', sectionTitle: 'Interessados', sectionLead: 'Leads e contatos. Em breve.' },
              // },
            ],
          },
        ],
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./components/merchant-orders-layout/merchant-orders-layout.component').then(
            (m) => m.MerchantOrdersLayoutComponent,
          ),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'pedidos' },
          {
            path: 'pedidos',
            loadComponent: () =>
              import('./pages/pedidos/merchant-orders-page/merchant-orders-page.component').then(
                (m) => m.MerchantOrdersPageComponent,
              ),
            data: { title: 'Pedidos' },
          },
          {
            path: 'pedidos/:id',
            loadComponent: () =>
              import('./pages/pedidos/merchant-order-detail-page/merchant-order-detail-page.component').then(
                (m) => m.MerchantOrderDetailPageComponent,
              ),
            data: { title: 'Detalhe do pedido' },
          },
          {
            path: 'vendas',
            loadComponent: () =>
              import('./pages/pedidos/merchant-vendas-page/merchant-vendas-page.component').then(
                (m) => m.MerchantVendasPageComponent,
              ),
            data: { title: 'Vendas' },
          },
          {
            path: 'pdv',
            loadComponent: () =>
              import('./pages/pedidos/merchant-pdv-page/merchant-pdv-page.component').then(
                (m) => m.MerchantPdvPageComponent,
              ),
            data: { title: 'Venda Presencial' },
          },
          // NÃO IMPLEMENTADO — /merchant/orders/clientes/*
          // {
          //   path: 'clientes',
          //   children: [
          //     { path: '', pathMatch: 'full', redirectTo: 'lista' },
          //     { path: 'lista',               loadComponent: () => import('./pages/contas/merchant-placeholder-page/merchant-placeholder-page.component').then((m) => m.MerchantPlaceholderPageComponent), data: { title: 'Clientes' } },
          //     { path: 'avaliacoes',          loadComponent: () => import('./pages/contas/merchant-placeholder-page/merchant-placeholder-page.component').then((m) => m.MerchantPlaceholderPageComponent), data: { title: 'Avaliações' } },
          //     { path: 'carrinho-abandonado', loadComponent: () => import('./pages/contas/merchant-placeholder-page/merchant-placeholder-page.component').then((m) => m.MerchantPlaceholderPageComponent), data: { title: 'Carrinho abandonado' } },
          //   ],
          // },
          // NÃO IMPLEMENTADO — /merchant/orders/painel
          // {
          //   path: 'painel',
          //   loadComponent: () =>
          //     import('./pages/contas/merchant-placeholder-page/merchant-placeholder-page.component').then(
          //       (m) => m.MerchantPlaceholderPageComponent,
          //     ),
          //   data: { title: 'Painel' },
          // },
        ],
      },
      {
        path: 'contas',
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./pages/contas/merchant-contas-page/merchant-contas-page.component').then(
                (m) => m.MerchantContasPageComponent,
              ),
            data: { title: 'Contas' },
          },
          {
            path: 'planos',
            loadComponent: () =>
              import('./pages/contas/merchant-planos-page/merchant-planos-page.component').then(
                (m) => m.MerchantPlanosPageComponent,
              ),
            data: { title: 'Planos e preços' },
          },
          {
            path: 'checkout-pendente',
            loadComponent: () =>
              import('./pages/contas/merchant-checkout-pendente-page/merchant-checkout-pendente-page.component').then(
                (m) => m.MerchantCheckoutPendentePage,
              ),
            data: { title: 'Aguardando pagamento' },
          },
          // NÃO IMPLEMENTADOS — /merchant/contas/*
          // { path: 'equipe',         loadComponent: () => import('./pages/contas/merchant-placeholder-page/merchant-placeholder-page.component').then((m) => m.MerchantPlaceholderPageComponent), data: { title: 'Equipe' } },
          // { path: 'ajuda',          loadComponent: () => import('./pages/contas/merchant-placeholder-page/merchant-placeholder-page.component').then((m) => m.MerchantPlaceholderPageComponent), data: { title: 'Ajuda' } },
          // { path: 'faq',            loadComponent: () => import('./pages/contas/merchant-placeholder-page/merchant-placeholder-page.component').then((m) => m.MerchantPlaceholderPageComponent), data: { title: 'FAQ' } },
          // { path: 'planos',         loadComponent: () => import('./pages/contas/merchant-placeholder-page/merchant-placeholder-page.component').then((m) => m.MerchantPlaceholderPageComponent), data: { title: 'Planos' } },
          // { path: 'reclamacoes',    loadComponent: () => import('./pages/contas/merchant-placeholder-page/merchant-placeholder-page.component').then((m) => m.MerchantPlaceholderPageComponent), data: { title: 'Reclamações' } },
          // { path: 'ponto-de-venda', loadComponent: () => import('./pages/contas/merchant-placeholder-page/merchant-placeholder-page.component').then((m) => m.MerchantPlaceholderPageComponent), data: { title: 'Ponto de venda' } },
          // { path: 'pix-recebidos',  loadComponent: () => import('./pages/contas/merchant-placeholder-page/merchant-placeholder-page.component').then((m) => m.MerchantPlaceholderPageComponent), data: { title: 'Pix recebidos' } },
        ],
      },
    ],
  },
];
