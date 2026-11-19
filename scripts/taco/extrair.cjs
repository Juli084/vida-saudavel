// Uso: node scripts/taco/extrair.cjs <taco-tab.txt> <taco-completa.json> <src/alimentos/taco.json>
//
// Lê a TACO 4ª edição (NEPA/UNICAMP, 2011) extraída com `pdftotext -table -enc UTF-8` (xpdf) e
// grava duas saídas: todas as colunas, para conferência, e o arquivo enxuto que o site usa.
// Cada página da Tabela 1 é de um de dois tipos (centesimal ou minerais e vitaminas), e a
// Tabela 2 traz os ácidos graxos. As colunas são localizadas pela posição das unidades no
// cabeçalho de cada página. O passo a passo está em docs/dados.md.
const fs = require('fs');
const [entrada, saida, saidaDoSite] = process.argv.slice(2);
const paginas = fs.readFileSync(entrada, 'utf8').split('\f');

const GRUPOS = [
  'Cereais e derivados',
  'Verduras, hortaliças e derivados',
  'Frutas e derivados',
  'Gorduras e óleos',
  'Pescados e frutos do mar',
  'Carnes e derivados',
  'Leite e derivados',
  'Bebidas (alcoólicas e não alcoólicas)',
  'Ovos e derivados',
  'Produtos açucarados',
  'Miscelâneas',
  'Outros alimentos industrializados',
  'Alimentos preparados',
  'Leguminosas e derivados',
  'Nozes e sementes',
];
const normal = (t) => t.replace(/\s+/g, ' ').trim();

const COLUNAS_A = ['umidade', 'energiaKcal', 'energiaKj', 'proteina', 'lipideos', 'colesterol', 'carboidrato', 'fibra', 'cinzas', 'calcio', 'magnesio'];
const COLUNAS_B = ['manganes', 'fosforo', 'ferro', 'sodio', 'potassio', 'cobre', 'zinco', 'retinol', 're', 'rae', 'tiamina', 'riboflavina', 'piridoxina', 'niacina', 'vitaminaC'];
const COLUNAS_G = ['saturados', 'monoinsaturados', 'poliinsaturados'];

/** "70,1" -> 70.1; "Tr" -> "Tr" (traço); "NA", "*", "-" -> null; sufixos de nota ("18b") saem. */
function valor(texto) {
  const t = texto.replace(/[a-z]+$/i, (sufixo) => (/^tr$/i.test(texto) || /^na$/i.test(texto) ? sufixo : ''));
  if (/^tr$/i.test(t)) return 'Tr';
  if (/^(na|\*|-|–)$/i.test(t) || t === '') return null;
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(n)) throw new Error(`valor inválido: "${texto}"`);
  return n;
}

/** Índices crescentes de coluna para cada posição, minimizando a soma das distâncias. */
function alinhar(posicoes, ancoras) {
  const n = posicoes.length;
  const m = ancoras.length;
  if (n > m) return null;
  const custo = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(Infinity));
  const escolha = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(-1));
  for (let j = 0; j <= m; j++) custo[0][j] = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = i; j <= m; j++) {
      const usando = custo[i - 1][j - 1] + Math.abs(posicoes[i - 1] - ancoras[j - 1]);
      const pulando = custo[i][j - 1];
      if (usando <= pulando) {
        custo[i][j] = usando;
        escolha[i][j] = 1;
      } else {
        custo[i][j] = pulando;
        escolha[i][j] = 0;
      }
    }
  }
  const resultado = new Array(n);
  let i = n;
  let j = m;
  while (i > 0) {
    if (escolha[i][j] === 1) {
      resultado[i - 1] = j - 1;
      i--;
      j--;
    } else j--;
  }
  return resultado;
}

const alimentos = new Map();
let grupoAtual = null; // o grupo continua de uma página da tabela centesimal para a próxima
const relatorio = { paginasA: 0, paginasB: 0, paginasG: 0 };

for (const pagina of paginas) {
  const linhas = pagina.split(/\r?\n/);
  const cabecalho = linhas.slice(0, 12).join(' ');
  let tipo = null;
  if (/Tabela 1\./.test(cabecalho) && /Umidade/.test(cabecalho)) tipo = 'A';
  else if (/Tabela 1\./.test(cabecalho) && /Mangan/.test(cabecalho)) tipo = 'B';
  // A Tabela 2 alterna páginas: só as que têm saturados, mono e poli-insaturados interessam.
  else if (/Tabela 2\./.test(cabecalho) && /turados/.test(cabecalho)) tipo = 'G';
  if (!tipo) continue;
  relatorio[`paginas${tipo}`] += 1;

  const unidades = linhas.find((l) => /^\s*Alimento\b/.test(l) && /\(/.test(l));
  if (!unidades) throw new Error(`página sem linha de unidades: ${cabecalho.slice(0, 80)}`);
  const ancoras = [...unidades.matchAll(/\([^)]*\)/g)].map((m) => m.index);
  const colunas = tipo === 'A' ? COLUNAS_A : tipo === 'B' ? COLUNAS_B : COLUNAS_G;
  if (tipo !== 'G' && ancoras.length !== colunas.length) {
    throw new Error(`página ${tipo} com ${ancoras.length} colunas, esperava ${colunas.length}`);
  }
  const inicioDosValores = ancoras[0] - 2;

  let ultimo = null;
  for (const linha of linhas) {
    if (!linha.trim()) continue;
    const texto = normal(linha);
    const nomeDoGrupo = GRUPOS.find((g) => normal(g) === texto || (texto === 'Frutos e derivados' && g === 'Frutas e derivados'));
    if (nomeDoGrupo) {
      if (tipo === 'A') grupoAtual = nomeDoGrupo;
      continue;
    }
    const m = linha.match(/^\s*(\d{1,3})\s{2,}/);
    if (!m) {
      // Continuação da descrição numa segunda linha (só na tabela com descrição).
      if (tipo !== 'B' && ultimo && !/^(Tabela|Número|Alimento|\s*\d+\s*$)/.test(linha.trim()) && linha.trimEnd().length < inicioDosValores) {
        ultimo.descricaoExtra = normal(`${ultimo.descricaoExtra ?? ''} ${texto}`);
      }
      continue;
    }
    const id = Number(m[1]);
    const registro = alimentos.get(id) ?? { id };
    if (tipo !== 'B') {
      const descricao = normal(linha.slice(m[0].length, inicioDosValores));
      if (tipo === 'A') {
        registro.nome = descricao;
        registro.grupo = grupoAtual;
      }
    }
    const resto = linha.slice(inicioDosValores);
    const tokens = [...resto.matchAll(/\S+/g)].map((t) => ({ texto: t[0], posicao: t.index + inicioDosValores }));
    // Cada valor vai para uma coluna, na ordem, com a menor soma de distâncias até o início
    // de cada coluna: assim uma linha levemente deslocada não troca valores de coluna.
    const atribuicao = alinhar(tokens.map((t) => t.posicao), ancoras);
    if (!atribuicao) throw new Error(`alimento ${id}: ${tokens.length} valores para ${ancoras.length} colunas`);
    tokens.forEach((token, i) => {
      const coluna = atribuicao[i];
      if (Math.abs(ancoras[coluna] - token.posicao) > 12) throw new Error(`alimento ${id}: "${token.texto}" longe da coluna ${coluna}`);
      if (coluna >= colunas.length) return; // ácidos graxos individuais, que não uso
      registro[colunas[coluna]] = valor(token.texto);
    });
    alimentos.set(id, registro);
    ultimo = tipo === 'A' ? registro : null;
  }
}

// A segunda linha da descrição, quando existe, entra no nome.
for (const a of alimentos.values()) {
  if (a.descricaoExtra) {
    a.nome = normal(`${a.nome} ${a.descricaoExtra}`);
    delete a.descricaoExtra;
  }
}

const lista = [...alimentos.values()].sort((a, b) => a.id - b.id);
fs.writeFileSync(saida, JSON.stringify(lista, null, 1));
console.log(JSON.stringify(relatorio), 'alimentos:', lista.length);

// Arquivo do site: só os nutrientes exibidos, com o nome usado no código. Valores: número,
// "Tr" (traço) ou null (não analisado ou não aplicável).
const CAMPOS_DO_SITE = {
  energia: 'energiaKcal',
  carboidrato: 'carboidrato',
  proteina: 'proteina',
  lipideos: 'lipideos',
  saturados: 'saturados',
  fibra: 'fibra',
  colesterol: 'colesterol',
  sodio: 'sodio',
  potassio: 'potassio',
  calcio: 'calcio',
  ferro: 'ferro',
  magnesio: 'magnesio',
  zinco: 'zinco',
  fosforo: 'fosforo',
  vitaminaC: 'vitaminaC',
  vitaminaA: 'rae',
  tiamina: 'tiamina',
  riboflavina: 'riboflavina',
  piridoxina: 'piridoxina',
  niacina: 'niacina',
};
if (saidaDoSite) {
  const site = {
    fonte: 'Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição revisada e ampliada. NEPA/UNICAMP, 2011.',
    grupos: GRUPOS,
    alimentos: lista.map((a) => {
      const enxuto = { id: a.id, nome: a.nome, grupo: GRUPOS.indexOf(a.grupo) };
      for (const [campo, origem] of Object.entries(CAMPOS_DO_SITE)) enxuto[campo] = a[origem] === undefined ? null : a[origem];
      return enxuto;
    }),
  };
  fs.writeFileSync(saidaDoSite, `${JSON.stringify(site)}\n`);
  console.log('site:', site.alimentos.length, 'alimentos,', Math.round(fs.statSync(saidaDoSite).size / 1024), 'KB');
}
