import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartIconComponent } from '../../../../shared/ui/cart-icon/cart-icon.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, CartIconComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  readonly supportEmail = 'suportevainozap@gmail.com';
  readonly whatsappPhone = '(83) 98766-5249';
  readonly whatsappUrl =
    'https://wa.me/5583987665249?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20VainoZap.';

  readonly features = [
    {
      icon: '🛍️',
      title: 'Catálogo Digital Personalizado',
      desc: 'Sua loja com sua cor, seu logo e seu link. Cada detalhe reflete a identidade da sua marca.',
      badge: '✦ Exclusivo',
      highlight: true,
    },
    {
      icon: '📦',
      title: 'Controle de Estoque',
      desc: 'Controle o estoque de cada produto e variação. Nunca mais venda o que não tem.',
      highlight: false,
    },
    {
      icon: '🏪',
      title: 'PDV Presencial',
      desc: 'Venda na loja física com o mesmo sistema. Registre pedidos presenciais direto no painel.',
      badge: '✦ Exclusivo',
      highlight: true,
    },
    {
      icon: '📊',
      title: 'Dashboard de Vendas',
      desc: 'Acompanhe faturamento, pedidos e produtos mais vendidos em tempo real.',
      highlight: false,
    },
    {
      icon: '🏬',
      title: 'Multi-loja',
      desc: 'Gerencie várias lojas com um só login. Ideal para quem tem mais de um negócio.',
      badge: '✦ Exclusivo',
      highlight: true,
    },
    {
      icon: '🔔',
      title: 'Notificações em Tempo Real',
      desc: 'Receba alertas instantâneos a cada novo pedido. Nunca perca uma venda.',
      highlight: false,
    },
  ];

  readonly aboutHighlights = [
    { value: '2026', label: 'Iniciamos em' },
    { value: '100%', label: 'Foco no varejo brasileiro' },
    { value: '24/7', label: 'Suporte ao lojista' },
  ];

  readonly aboutValues = [
    {
      icon: '🎯',
      title: 'Nossa missão',
      desc: 'Democratizar o comércio digital para quem vende pelo WhatsApp todos os dias.',
    },
    {
      icon: '💡',
      title: 'Nossa visão',
      desc: 'Ser a plataforma mais simples e confiável para lojistas autônomos no Brasil.',
    },
    {
      icon: '🤝',
      title: 'Nossos valores',
      desc: 'Transparência, sem taxa por venda, produto pensado para o dia a dia real da loja.',
    },
  ];

  readonly plans = [
    {
      name: 'Starter',
      price: 'Grátis',
      period: '',
      desc: 'Para quem está começando e quer testar sem compromisso.',
      features: ['Até 20 produtos', '1 loja', 'Pedidos via WhatsApp', 'Link personalizado'],
      cta: 'Começar grátis',
      ctaStyle: 'outline',
      popular: false,
    },
    {
      name: 'Pro',
      price: 'R$ 49',
      period: '/mês',
      desc: 'Para lojistas que vendem de verdade e precisam de controle total.',
      features: [
        'Produtos ilimitados',
        'Até 3 lojas',
        'PDV presencial',
        'Controle de estoque',
        'Dashboard de vendas',
        'Notificações em tempo real',
      ],
      cta: 'Assinar agora',
      ctaStyle: 'filled',
      popular: true,
    },
    {
      name: 'Business',
      price: 'R$ 99',
      period: '/mês',
      desc: 'Para quem tem múltiplos negócios e precisa de escala.',
      features: [
        'Produtos ilimitados',
        'Lojas ilimitadas',
        'Tudo do plano Pro',
        'Suporte prioritário',
        'Domínio próprio',
      ],
      cta: 'Falar com vendas',
      ctaStyle: 'green',
      popular: false,
    },
  ];
}
