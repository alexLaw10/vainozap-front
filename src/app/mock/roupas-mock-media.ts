/**
 * Fotos de vestuário (Unsplash) para mocks — substituir por CDN da loja na API.
 * Parâmetros fixos para cache e layout estáveis.
 */
const q = 'auto=format&fit=crop&q=80';

export const ROUPAS_MOCK_MEDIA = {
  categorias: {
    blusas: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?${q}&w=400&h=400`,
    calcas: `https://images.unsplash.com/photo-1542272604-787c3835535d?${q}&w=400&h=400`,
    vestidos: `https://images.unsplash.com/photo-1595777457583-95e059d581b8?${q}&w=400&h=400`,
    casacos: `https://images.unsplash.com/photo-1539533018447-63fcce2678e3?${q}&w=400&h=400`,
  },
  produtos: {
    blusaListrada: `https://images.unsplash.com/photo-1503341504253-dff4815485f1?${q}&w=800&h=1000`,
    calcaJeans: `https://images.unsplash.com/photo-1541099649105-f69ad21f3246?${q}&w=800&h=1000`,
    vestidoFloral: `https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?${q}&w=800&h=1000`,
    jaquetaJeans: `https://images.unsplash.com/photo-1551028719-00167b16eac5?${q}&w=800&h=1000`,
    blusaTrico: `https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?${q}&w=800&h=1000`,
    vestidoTubinho: `https://images.unsplash.com/photo-1496747611176-843222e1e57c?${q}&w=800&h=1000`,
    /** Galeria longa (ex.: página de detalhe Conjunto Speed). */
    conjuntoSpeed1: `https://images.unsplash.com/photo-1518611012112-6052e373f299?${q}&w=800&h=1000`,
    conjuntoSpeed2: `https://images.unsplash.com/photo-1574680096145-d05b474e2155?${q}&w=800&h=1000`,
    conjuntoSpeed3: `https://images.unsplash.com/photo-1594381898411-846e7d193883?${q}&w=800&h=1000`,
    conjuntoSpeed4: `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?${q}&w=800&h=1000`,
    conjuntoSpeed5: `https://images.unsplash.com/photo-1518310383802-640c2de311b2?${q}&w=800&h=1000`,
    conjuntoSpeed6: `https://images.unsplash.com/photo-1506126613408-eca07ce68773?${q}&w=800&h=1000`,
    conjuntoSpeed7: `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?${q}&w=800&h=1000`,
    conjuntoSpeed8: `https://images.unsplash.com/photo-1517836357463-d25dfeac3438?${q}&w=800&h=1000`,
    conjuntoSpeed9: `https://images.unsplash.com/photo-1517649763962-0cb87689efcc?${q}&w=800&h=1000`,
    conjuntoSpeed10: `https://images.unsplash.com/photo-1538805060514-976732ea638e?${q}&w=800&h=1000`,
    conjuntoSpeed11: `https://images.unsplash.com/photo-1517677129809-707159fdb082?${q}&w=800&h=1000`,
    conjuntoSpeed12: `https://images.unsplash.com/photo-1599058940339-3506d38dd9ed?${q}&w=800&h=1000`,
    conjuntoSpeed13: `https://images.unsplash.com/photo-1576678927489-cc6b0b244d76?${q}&w=800&h=1000`,
    conjuntoSpeed14: `https://images.unsplash.com/photo-1594736797933-d004d925d488?${q}&w=800&h=1000`,
    conjuntoSpeed15: `https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?${q}&w=800&h=1000`,
  },
} as const;
