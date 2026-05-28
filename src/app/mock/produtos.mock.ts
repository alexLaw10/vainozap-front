import { Categoria, Produto } from '../core/models/produto.model';
import { ROUPAS_MOCK_MEDIA } from './roupas-mock-media';

const cat = ROUPAS_MOCK_MEDIA.categorias;
const img = ROUPAS_MOCK_MEDIA.produtos;

export const CATEGORIAS_MOCK: Categoria[] = [
  {
    id: '1',
    nome: 'Blusas',
    slug: 'blusas',
    imagemUrl: cat.blusas,
  },
  {
    id: '2',
    nome: 'Calças',
    slug: 'calcas',
    imagemUrl: cat.calcas,
  },
  {
    id: '3',
    nome: 'Vestidos',
    slug: 'vestidos',
    imagemUrl: cat.vestidos,
  },
  {
    id: '4',
    nome: 'Casacos',
    slug: 'casacos',
    imagemUrl: cat.casacos,
  },
];

export const PRODUTOS_MOCK: Produto[] = [
  {
    id: '1',
    nome: 'Blusa Listrada Premium',
    descricao:
      'Blusa de algodão com listras, caimento solto. Ideal para o dia a dia; tecido leve e respirável.',
    preco: 89.9,
    fotos: [img.blusaListrada, img.blusaTrico, img.vestidoFloral, img.jaquetaJeans, img.vestidoTubinho],
    categoriaId: '1',
    variacoes: [
      {
        id: 'tamanho',
        nome: 'Tamanho',
        opcoes: [
          { id: 'p', valor: 'P', estoque: 5 },
          { id: 'm', valor: 'M', estoque: 3 },
          { id: 'g', valor: 'G', estoque: 0 },
          { id: 'gg', valor: 'GG', estoque: 2 },
        ],
      },
    ],
    ativo: true,
    destaque: true,
  },
  {
    id: '2',
    nome: 'Calça Jeans Skinny',
    descricao: 'Calça jeans com elastano para conforto e modelagem skinny. Lavagem média versátil.',
    preco: 149.9,
    fotos: [img.calcaJeans, img.jaquetaJeans, img.blusaListrada, img.vestidoTubinho, img.blusaTrico],
    categoriaId: '2',
    variacoes: [
      {
        id: 'tamanho',
        nome: 'Tamanho',
        opcoes: [
          { id: '36', valor: '36', estoque: 4 },
          { id: '38', valor: '38', estoque: 6 },
          { id: '40', valor: '40', estoque: 2 },
          { id: '42', valor: '42', estoque: 1 },
        ],
      },
    ],
    ativo: true,
    novo: true,
  },
  {
    id: '3',
    nome: 'Vestido Floral Midi',
    descricao: 'Vestido midi com estampa floral, decote discreto e cintura marcada. Perfeito para eventos e jantares.',
    preco: 199.9,
    fotos: [
      img.vestidoFloral,
      img.vestidoTubinho,
      img.blusaTrico,
      img.jaquetaJeans,
      img.calcaJeans,
      img.blusaListrada,
    ],
    categoriaId: '3',
    informacoesFicha: [
      'Tecido leve com toque suave; composição pensada para conforto em longas horas de uso.',
      'Modelagem midi com cintura marcada; acabamento interno limpo.',
    ],
    caracteristicasFicha: [
      'Ideal para eventos e jantares em clima ameno.',
      'Combine com sandálias ou salto para compor o look.',
    ],
    variacoes: [
      {
        id: 'tamanho',
        nome: 'Tamanhos',
        opcoes: [
          { id: 'p', valor: 'P', estoque: 2 },
          { id: 'm', valor: 'M', estoque: 5 },
          { id: 'g', valor: 'G', estoque: 3 },
        ],
      },
      {
        id: 'cor',
        nome: 'Cores',
        opcoes: [
          { id: 'rosa', valor: 'Rosa', estoque: 5, swatch: '#e11d48' },
          { id: 'azul', valor: 'Azul', estoque: 5, swatch: '#2563eb' },
        ],
      },
    ],
    ativo: true,
  },
  {
    id: '4',
    nome: 'Jaqueta Jeans Oversized',
    descricao: 'Jaqueta jeans com modelagem oversized, bolsos frontais e barra ajustável. Camada ideal entre estações.',
    preco: 189.9,
    fotos: [img.jaquetaJeans, img.calcaJeans, img.blusaListrada, img.vestidoFloral, img.blusaTrico],
    categoriaId: '4',
    variacoes: [
      {
        id: 'tamanho',
        nome: 'Tamanho',
        opcoes: [
          { id: 'p', valor: 'P', estoque: 3 },
          { id: 'm', valor: 'M', estoque: 5 },
          { id: 'g', valor: 'G', estoque: 2 },
        ],
      },
    ],
    ativo: true,
  },
  {
    id: '5',
    nome: 'Blusa de Tricô Canelado',
    descricao: 'Blusa de tricô canelado, toque macio e manga longa. Combina com calça jeans ou saia.',
    preco: 119.9,
    fotos: [img.blusaTrico, img.blusaListrada, img.vestidoTubinho, img.jaquetaJeans, img.vestidoFloral],
    categoriaId: '1',
    variacoes: [
      {
        id: 'cor',
        nome: 'Cores',
        opcoes: [
          { id: 'bege', valor: 'Bege', estoque: 8, swatch: '#d4b896' },
          { id: 'preto', valor: 'Preto', estoque: 4, swatch: '#1e293b' },
          { id: 'branco', valor: 'Branco', estoque: 3, swatch: '#f8fafc' },
        ],
      },
      {
        id: 'tamanho',
        nome: 'Tamanhos',
        opcoes: [
          { id: 'p', valor: 'P', estoque: 5 },
          { id: 'm', valor: 'M', estoque: 8 },
          { id: 'g', valor: 'G', estoque: 4 },
        ],
      },
    ],
    ativo: true,
  },
  {
    id: '6',
    nome: 'Vestido Tubinho Preto',
    descricao: 'Vestido tubinho midi preto, alfaiataria leve. Corte retilíneo para ocasiões formais ou office.',
    preco: 249.9,
    fotos: [img.vestidoTubinho, img.vestidoFloral, img.blusaTrico, img.jaquetaJeans, img.calcaJeans],
    categoriaId: '3',
    variacoes: [
      {
        id: 'tamanho',
        nome: 'Tamanho',
        opcoes: [
          { id: 'pp', valor: 'PP', estoque: 1 },
          { id: 'p', valor: 'P', estoque: 3 },
          { id: 'm', valor: 'M', estoque: 4 },
          { id: 'g', valor: 'G', estoque: 2 },
        ],
      },
    ],
    ativo: true,
  },
  {
    id: '7',
    nome: 'Conjunto Speed',
    descricao:
      'Conjunto fitness com top e shorts coordenados. Visual clean para treino ou dia a dia esportivo.',
    preco: 79.9,
    fotos: [
      img.conjuntoSpeed1,
      img.conjuntoSpeed2,
      img.conjuntoSpeed3,
      img.conjuntoSpeed4,
      img.conjuntoSpeed5,
      img.conjuntoSpeed6,
      img.conjuntoSpeed7,
      img.conjuntoSpeed8,
      img.conjuntoSpeed9,
      img.conjuntoSpeed10,
      img.conjuntoSpeed11,
      img.conjuntoSpeed12,
      img.conjuntoSpeed13,
      img.conjuntoSpeed14,
      img.conjuntoSpeed15,
    ],
    categoriaId: '1',
    informacoesFicha: [
      'Tecido premium em poliamida com gramatura elevada (aprox. 300 g/m²), toque macio e boa recuperação após o uso.',
      'Forro removível no top; composição: 83% poliamida e 17% elastano.',
      'Acabamento de alta qualidade, com opacidade elevada no uso e modelagem pensada para treino.',
    ],
    caracteristicasFicha: [
      'Tecido respirável e confortável em movimento',
      'Proteção UV e compressão na medida certa',
      'Zero transparência',
      'Modelagem testada',
      'Detalhes refletivos para treinos em horário noturno',
    ],
    recomendacaoLavagem:
      'Lavar à mão ou máquina no ciclo delicado, com água fria. Não alvejar. Secar à sombra. Não passar ferro sobre estampas ou detalhes refletivos.',
    variacoes: [
      {
        id: 'cor',
        nome: 'Cores',
        opcoes: [
          { id: 'c-azul', valor: 'Azul ELEGANCE', estoque: 12, swatch: '#1e3a8a' },
          { id: 'c-lavanda', valor: 'Lavanda', estoque: 8, swatch: '#c4b5fd' },
          { id: 'c-acai', valor: 'Açaí', estoque: 10, swatch: '#5b21b6' },
          { id: 'c-mousse', valor: 'Mousse', estoque: 6, swatch: '#c4b5a0' },
          { id: 'c-rosabebe', valor: 'Rosa bebe (CLARINHO)', estoque: 5, swatch: '#fbcfe8' },
          { id: 'c-conexao', valor: 'Conexão', estoque: 7, swatch: '#be185d' },
          { id: 'c-areia', valor: 'Areia', estoque: 9, swatch: '#e8dcc4' },
          { id: 'c-preto', valor: 'Preto', estoque: 15, swatch: '#0f172a' },
        ],
      },
      {
        id: 'tamanho',
        nome: 'Tamanhos',
        opcoes: [
          { id: 'm', valor: 'M', estoque: 20 },
          { id: 'g', valor: 'G', estoque: 18 },
        ],
      },
    ],
    ativo: true,
  },
];
