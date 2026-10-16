// Mapa do Assaí Atacadista de Indaiatuba
// Atualizado conforme confirmações do usuário

export const SECTIONS = [
  { id: 'c02', name: 'Corredor 02', store: 'assai' as const, order: 1 },
  { id: 'c03', name: 'Corredor 03', store: 'assai' as const, order: 2 },
  { id: 'c04', name: 'Corredor 04', store: 'assai' as const, order: 3 },
  { id: 'c05', name: 'Corredor 05', store: 'assai' as const, order: 4 },
  { id: 'c06', name: 'Corredor 06', store: 'assai' as const, order: 5 },
  { id: 'c07', name: 'Corredor 07', store: 'assai' as const, order: 6 },
  { id: 'c08', name: 'Corredor 08', store: 'assai' as const, order: 7 },
  { id: 'c09', name: 'Corredor 09', store: 'assai' as const, order: 8 },
  { id: 'c10', name: 'Corredor 10', store: 'assai' as const, order: 9 },
  { id: 'c11', name: 'Corredor 11', store: 'assai' as const, order: 10 },
  { id: 'c12', name: 'Corredor 12', store: 'assai' as const, order: 11 },
  { id: 'hortifruti', name: 'Hortifruti', store: 'assai' as const, order: 12 },
  { id: 'ilha_queijos', name: 'Ilha dos Queijos', store: 'assai' as const, order: 13 },
  { id: 'geladeiras', name: 'Geladeiras', store: 'assai' as const, order: 14 },
  { id: 'congeladores', name: 'Congeladores', store: 'assai' as const, order: 15 },
  { id: 'acougue', name: 'Açougue', store: 'assai' as const, order: 16 },
  { id: 'farmacia', name: 'Farmácia', store: 'farmacia' as const, order: 17 },
  { id: 'covabra', name: 'Covabra', store: 'covabra' as const, order: 18 },
  { id: 'sem_secao', name: 'Sem seção confirmada', store: 'assai' as const, order: 19 },
]

// Palavras-chave por seção — baseado no mapa confirmado pelo usuário
const SECTION_KEYWORDS: Record<string, string[]> = {
  c02: ['agua de coco', 'energetico', 'suco em po', 'aperitivo', 'salgadinho', 'batata palha'],
  c03: ['guardanapo', 'papel aluminio', 'palito', 'plastico', 'garrafa termica', 'papel toalha', 'palito de churrasco'],
  c04: ['papel higienico', 'papel higiênico', 'racao', 'ração', 'saco de lixo'],
  c05: ['absorvente', 'higiene bucal', 'escova dental', 'gel dental', 'condicionador', 'shampoo', 'fralda', 'higiene infantil', 'sabonete', 'hidratante', 'desodorante', 'lenco umedecido', 'lenço umedecido'],
  c06: ['amaciante', 'pre-lavagem', 'pre lavagem', 'sabao liquido', 'sabão líquido', 'sabao sache', 'sabao em barra', 'sabao em po', 'sabão em pó', 'agua sanitaria', 'água sanitária', 'desinfetante', 'sabao roupa', 'sabão roupa', 'refil sabao', 'refil sabão', 'lavanda'],
  c07: ['sardinha', 'mostarda', 'maionese', 'alcool', 'álcool', 'multiuso', 'inseticida', 'conserva', 'azeitona', 'ervilha', 'detergente', 'desengordurante', 'atum', 'esponja'],
  c08: ['azeite', 'oleo de soja', 'óleo de soja', 'oleo', 'óleo', 'molho pronto', 'extrato de tomate', 'shoyu', 'molho de pimenta', 'tempero', 'vinagre', 'sal', 'noz moscada', 'noz-moscada'],
  c09: ['farinha de trigo', 'farinha', 'massa', 'macarrao', 'macarrão', 'queijo ralado', 'miojo', 'lasanha', 'pipoca', 'tapioca', 'farinaceos', 'farináceos'],
  c10: ['achocolatado', 'chocolato', 'mistura para bolo', 'mingau', 'leite em po', 'leite em pó', 'leite infantil', 'leite longa vida', 'leite', 'adocante', 'adoçante', 'cha', 'chá', 'cafe', 'café', 'leite condensado', 'creme de leite', 'gelatina', 'nutella', 'granulado', 'granola'],
  c11: ['cream cracker', 'polvilho', 'torrada', 'chocolate', 'pacoca', 'paçoca', 'biscoito recheado', 'cookie', 'wafer', 'rosquinha', 'amanteigado', 'biscoito salgado', 'biscoito', 'bolacha'],
  c12: ['leite longa vida'],
  hortifruti: ['banana', 'maca', 'maçã', 'laranja', 'uva', 'alho', 'batata', 'cebola', 'tomate', 'limao', 'limão', 'cenoura', 'alface', 'brocolis', 'brócolis'],
  ilha_queijos: ['cheddar', 'mussarela', 'queijo', 'rap10', 'ovos', 'ovo', 'pao', 'pão'],
  geladeiras: ['manteiga', 'requeijao', 'requeijão', 'ricota'],
  congeladores: ['pao de queijo', 'pão de queijo', 'congelado'],
  acougue: ['frango', 'carne', 'picanha', 'alcatra', 'patinho', 'costela', 'linguica', 'linguiça', 'salsicha', 'bacon'],
  farmacia: ['remedio', 'remédio', 'medicamento', 'comprimido', 'capsulas', 'cápsulas', 'vitamina', 'suplemento', 'proteina', 'proteína', 'whey', 'creatina', 'colágeno', 'colageno', 'omega', 'ômega', 'pomada', 'band-aid', 'curativo', 'esparadrapo', 'dipirona', 'paracetamol', 'ibuprofeno', 'aspirina', 'antigripal', 'antialergico', 'antiálergico'],
  covabra: ['camisinha', 'bolacha magic', 'cha de tpm', 'chá de tpm'],
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

export function assignSection(itemName: string): string {
  const name = normalize(itemName)

  // Check farmacia first
  for (const keyword of SECTION_KEYWORDS.farmacia) {
    if (name.includes(normalize(keyword))) return 'farmacia'
  }

  // Check covabra (items that only exist there)
  for (const keyword of SECTION_KEYWORDS.covabra) {
    if (name.includes(normalize(keyword))) return 'covabra'
  }

  // Check all other sections
  for (const [sectionId, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (sectionId === 'covabra' || sectionId === 'farmacia') continue
    for (const keyword of keywords) {
      const k = normalize(keyword)
      if (name.includes(k) || (k.length > 4 && k.includes(name))) {
        return sectionId
      }
    }
  }

  return 'sem_secao'
}

export function getSectionName(sectionId: string): string {
  return SECTIONS.find(s => s.id === sectionId)?.name ?? 'Sem seção confirmada'
}

export function getSectionOrder(sectionId: string): number {
  return SECTIONS.find(s => s.id === sectionId)?.order ?? 99
}
