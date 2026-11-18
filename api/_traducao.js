// O "_" no nome faz a Vercel tratar o arquivo como módulo auxiliar, não como rota.
// A base do Spoonacular só tem receitas em inglês. Os termos mais comuns digitados em
// português viram inglês antes da busca, e os ingredientes mais comuns voltam em
// português na tela. O que não está aqui aparece como veio.

export const PARA_INGLES = {
  frango: 'chicken',
  carne: 'beef',
  'carne moida': 'ground beef',
  porco: 'pork',
  peixe: 'fish',
  salmao: 'salmon',
  atum: 'tuna',
  camarao: 'shrimp',
  ovo: 'egg',
  ovos: 'eggs',
  arroz: 'rice',
  feijao: 'beans',
  'grao de bico': 'chickpea',
  lentilha: 'lentil',
  macarrao: 'pasta',
  salada: 'salad',
  sopa: 'soup',
  bolo: 'cake',
  panqueca: 'pancake',
  omelete: 'omelette',
  legumes: 'vegetables',
  batata: 'potato',
  'batata doce': 'sweet potato',
  abobora: 'pumpkin',
  brocolis: 'broccoli',
  cenoura: 'carrot',
  espinafre: 'spinach',
  tomate: 'tomato',
  cogumelo: 'mushroom',
  aveia: 'oats',
  banana: 'banana',
  maca: 'apple',
  morango: 'strawberry',
  chocolate: 'chocolate',
  iogurte: 'yogurt',
  queijo: 'cheese',
  vegano: 'vegan',
  vegetariano: 'vegetarian',
  'cafe da manha': 'breakfast',
  lanche: 'snack',
  vitamina: 'smoothie',
  quinoa: 'quinoa',
  tofu: 'tofu',
  abacate: 'avocado',
  limao: 'lemon',
  coco: 'coconut',
};

export const PARA_PORTUGUES = {
  salt: 'sal',
  pepper: 'pimenta-do-reino',
  'black pepper': 'pimenta-do-reino',
  'olive oil': 'azeite',
  oil: 'óleo',
  butter: 'manteiga',
  sugar: 'açúcar',
  flour: 'farinha de trigo',
  water: 'água',
  milk: 'leite',
  egg: 'ovo',
  eggs: 'ovos',
  garlic: 'alho',
  onion: 'cebola',
  'red onion': 'cebola roxa',
  tomato: 'tomate',
  tomatoes: 'tomate',
  carrot: 'cenoura',
  carrots: 'cenoura',
  potato: 'batata',
  potatoes: 'batata',
  'sweet potato': 'batata-doce',
  broccoli: 'brócolis',
  spinach: 'espinafre',
  lettuce: 'alface',
  cucumber: 'pepino',
  'bell pepper': 'pimentão',
  zucchini: 'abobrinha',
  mushrooms: 'cogumelos',
  avocado: 'abacate',
  lemon: 'limão-siciliano',
  'lemon juice': 'suco de limão',
  lime: 'limão',
  banana: 'banana',
  apple: 'maçã',
  strawberries: 'morangos',
  rice: 'arroz',
  pasta: 'macarrão',
  oats: 'aveia',
  quinoa: 'quinoa',
  chickpeas: 'grão-de-bico',
  'black beans': 'feijão-preto',
  lentils: 'lentilha',
  'chicken breast': 'peito de frango',
  chicken: 'frango',
  'ground beef': 'carne moída',
  beef: 'carne bovina',
  salmon: 'salmão',
  tuna: 'atum',
  shrimp: 'camarão',
  tofu: 'tofu',
  cheese: 'queijo',
  'parmesan cheese': 'parmesão',
  yogurt: 'iogurte',
  'greek yogurt': 'iogurte grego',
  honey: 'mel',
  cinnamon: 'canela',
  parsley: 'salsinha',
  cilantro: 'coentro',
  basil: 'manjericão',
  'soy sauce': 'molho de soja',
  vinegar: 'vinagre',
  'coconut milk': 'leite de coco',
};

export function semAcento(texto) {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/** Troca expressões de duas palavras primeiro ("batata doce") e depois palavras soltas. */
export function traduzirBusca(termo) {
  let texto = ` ${semAcento(termo).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')} `;
  const chaves = Object.keys(PARA_INGLES).sort((a, b) => b.length - a.length);
  for (const chave of chaves) texto = texto.replaceAll(` ${chave} `, ` ${PARA_INGLES[chave]} `);
  return texto.trim();
}

export function nomeEmPortugues(nome) {
  const chave = nome.toLowerCase().trim();
  return PARA_PORTUGUES[chave] ?? nome;
}
