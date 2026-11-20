// Uso: node scripts/receitas-ms/extrair.cjs <texto-todas.json> <conferencia.json> <src/receitas/ministerio.json>
//
// Lê as 111 fichas técnicas de "Alimentos Regionais Brasileiros" (Ministério da Saúde, 2ª ed.,
// 2015) a partir do texto com posições que scripts/receitas-ms/ler.cjs tira do PDF com o pdf.js,
// e grava duas saídas: tudo, com as notas de leitura, para conferência, e o arquivo que o site usa.
// O nome e a região vêm do Apêndice D do livro (os títulos nas fotos usam uma fonte que não sai
// como texto). Tudo o que não fecha vai para o relatório no fim. O passo a passo está em
// docs/receitas.md.
const fs = require('fs');
const [entrada, saida, saidaDoSite] = process.argv.slice(2);
const paginas = JSON.parse(fs.readFileSync(entrada, 'utf8'));
const problemas = [];
const avisar = (pagina, msg) => problemas.push(`pág. ${pagina}: ${msg}`);
// Sódio impresso em "g": quase sempre é mg (doce de fruta não tem 56 g de sódio). Nestas duas, com
// charque, o valor só fecha em gramas: o sal e o charque já passam de 1.000 mg por porção.
const SODIO_EM_GRAMAS = new Set([154, 180]);

const limpar = (s) => s.replace(/\s+/g, ' ').trim();
const itensDe = (n) => (paginas[n]?.itens ?? []).filter((i) => i.s.trim() !== '');

/** Agrupa itens em linhas pela altura (y), com tolerância, e ordena da esquerda para a direita. */
function linhas(itens, tolerancia = 2.5) {
  const ordenados = [...itens].sort((a, b) => a.y - b.y || a.x - b.x);
  const grupos = [];
  for (const item of ordenados) {
    const ultimo = grupos.at(-1);
    if (ultimo && Math.abs(ultimo.y - item.y) <= tolerancia) ultimo.itens.push(item);
    else grupos.push({ y: item.y, itens: [item] });
  }
  for (const g of grupos) g.itens.sort((a, b) => a.x - b.x);
  return grupos;
}
const textoDaLinha = (g) => limpar(g.itens.map((i) => i.s).join(' '));

/* ---------- Apêndice D: nome, região e página ---------- */
const indice = new Map();
for (const n of [476, 477, 478, 479]) {
  let regiao = null;
  for (const g of linhas(itensDe(n))) {
    const nome = g.itens.filter((i) => i.x < 300).map((i) => i.s).join(' ').trim();
    const numero = g.itens.find((i) => i.x > 400 && /^\d{1,3}$/.test(i.s.trim()));
    if (/^Região /.test(nome)) {
      regiao = nome.replace('Região ', '').replace('Centro-oeste', 'Centro-Oeste');
      continue;
    }
    if (regiao && numero && nome) indice.set(Number(numero.s), { nome, regiao });
  }
}

/* ---------- Valores ---------- */
function numeroBr(texto) {
  const m = texto.replace(/\s/g, '').match(/^(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d+))?/);
  if (!m) return null;
  return Number(m[1].replace(/\./g, '') + (m[2] ? `.${m[2]}` : ''));
}
function quantidade(texto) {
  const t = limpar(texto);
  const m = t.match(/^([\d.,]+)\s*(kg|g|ml|l)$/i);
  if (!m) return null;
  return { valor: numeroBr(m[1]), unidade: m[2].toLowerCase(), texto: t.replace(/^([\d.,]+)\s*/, '$1 ') };
}
const ehQuantidade = (s) => /^[\d.,]+\s*(kg|g|ml|l)$/i.test(limpar(s));

const ROTULOS = [
  ['valor energetico', 'energia'],
  ['carboidratos', 'carboidrato'],
  ['proteinas', 'proteina'],
  ['gorduras totais', 'gorduras'],
  ['gorduras saturadas', 'saturadas'],
  ['gorduras trans', 'trans'],
  ['fibra alimentar', 'fibra'],
  ['sodio', 'sodio'],
];
const semAcento = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function tituloCurto(tipo) {
  const t = limpar(tipo).toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/* ---------- Uma ficha ---------- */
function ficha(n) {
  const itens = itensDe(n);
  const achar = (re) => itens.find((i) => re.test(i.s));
  const numeroImpresso = itens.find((i) => i.y > 690 && /^\d{1,3}$/.test(i.s.trim()));
  const pagina = numeroImpresso ? Number(numeroImpresso.s) : null;
  if (!pagina) avisar(n, 'sem número de página impresso');
  const doIndice = indice.get(pagina);
  if (!doIndice) avisar(n, `página impressa ${pagina} fora do Apêndice D`);

  // Âncoras da própria página: as margens mudam entre página par e ímpar.
  const rotuloTipo = achar(/TIPO DE PREPARA/);
  const rotuloPercentual = achar(/PERCENTUAL DE/);
  const rotuloInfo = achar(/INFORMAÇÃO NUTRICIONAL/);
  const cabecalho = itens.find((i) => i.s.trim() === 'Ingredientes');
  const colunaPeso = achar(/^Peso bruto/);
  const rendimento = itens.find((i) => /^Rendimento:?/.test(i.s.trim()));
  const porcao = itens.find((i) => /^P?orção:?$/.test(i.s.trim()));
  const rotuloModo = achar(/MODO DE PREPARO/);
  if (!rotuloTipo || !rotuloInfo || !cabecalho || !colunaPeso || !rendimento || !porcao || !rotuloModo) {
    avisar(n, 'âncora da ficha não encontrada');
    return null;
  }
  const xPainel = Math.min(rotuloInfo.x, rotuloPercentual?.x ?? Infinity) - 4;
  const negrito = cabecalho.f;
  // Em fichas longas, rendimento e porção ficam no painel da direita, e a tabela desce até o modo de preparo.
  const rendimentoNoPainel = rendimento.x >= xPainel;

  // Tipo de preparação: texto em maiúsculas logo abaixo do rótulo.
  const tipo = itens
    .filter((i) => i !== rotuloTipo && i.y > rotuloTipo.y + 5 && i.y < rotuloTipo.y + 46 && i.x < xPainel && /^[A-ZÀ-Ú ,/-]+$/.test(i.s.trim()))
    .map((i) => i.s)
    .join(' ');

  const notas = [];
  // Tabela de ingredientes: nome | peso bruto | medida caseira. Nome e medida podem ocupar duas
  // linhas, com o peso centralizado entre elas; por isso cada linha se prende ao peso mais próximo.
  const fundoTabela = rendimentoNoPainel ? rotuloModo.y - 5 : rendimento.y - 2;
  const naTabela = itens.filter((i) => i.y > cabecalho.y + 2 && i.y < fundoTabela && i.x < xPainel && !(Math.abs(i.y - porcao.y) < 2 && !rendimentoNoPainel));
  // Peso: "150 g", "1,3 kg", "300" (impresso sem unidade: lido como grama) ou "150 g g".
  const pesoLido = (i) => {
    const t = limpar(i.s).replace(/\s+(g|ml)\s+(g|ml)$/i, ' $1');
    if (ehQuantidade(t)) return t;
    if (/^[\d.,]+$/.test(t) && i.x >= colunaPeso.x - 3 && i.x <= colunaPeso.x + 40) return `${t} g`;
    return null;
  };
  const tipoDe = (i) => (pesoLido(i) ? 'peso' : i.x < colunaPeso.x - 3 ? 'nome' : i.x > colunaPeso.x + 40 ? 'medida' : 'peso?');
  const grupos = linhas(naTabela).map((g) => ({
    y: g.y,
    nome: g.itens.filter((i) => tipoDe(i) === 'nome'),
    peso: g.itens.find((i) => tipoDe(i) === 'peso'),
    medida: g.itens.filter((i) => tipoDe(i) === 'medida'),
    estranho: g.itens.filter((i) => tipoDe(i) === 'peso?'),
  }));
  for (const g of grupos) if (g.estranho.length) avisar(n, `texto na coluna de peso: "${g.estranho.map((i) => i.s).join(' ')}"`);
  const ehSecao = (g) => !g.peso && !g.medida.length && g.nome.length && g.nome.every((i) => i.f === negrito);
  // 1) Linhas com peso são as âncoras; nome e medida em até três linhas se prendem à mais próxima.
  const ancoras = grupos.filter((g) => g.peso);
  const linhasDe = new Map(ancoras.map((a) => [a, [a]]));
  const soltas = [];
  for (const g of grupos) {
    if (g.peso) continue;
    if (ehSecao(g)) {
      soltas.push(g);
      continue;
    }
    const perto = ancoras.reduce((melhor, a) => (Math.abs(a.y - g.y) < Math.abs((melhor?.y ?? Infinity) - g.y) ? a : melhor), null);
    if (perto && Math.abs(perto.y - g.y) <= 11) linhasDe.get(perto).push(g);
    else soltas.push(g);
  }
  // 2) O que sobra: subtítulo (uma linha só com nome) ou ingrediente sem peso ("para untar a forma").
  const blocos = [];
  for (const g of soltas) {
    const ultimo = blocos.at(-1);
    if (ultimo && !ehSecao(g) && !ehSecao(ultimo.linhas[0]) && g.y - ultimo.linhas.at(-1).y <= 12) ultimo.linhas.push(g);
    else blocos.push({ y: g.y, linhas: [g] });
  }
  const juntar = (lista, campo) =>
    limpar(
      [...lista]
        .sort((a, b) => a.y - b.y)
        .flatMap((g) => g[campo])
        .map((i) => i.s)
        .join(' '),
    );
  const entradas = [...ancoras.map((a) => ({ y: a.y, ancora: a })), ...blocos.map((b) => ({ y: b.y, bloco: b }))].sort((a, b) => a.y - b.y);
  const ingredientes = [];
  for (const e of entradas) {
    if (e.bloco) {
      const ls = e.bloco.linhas;
      const nome = juntar(ls, 'nome');
      const medida = juntar(ls, 'medida');
      if (nome && !medida && (ls.length === 1 || ehSecao(ls[0]))) ingredientes.push({ secao: nome.replace(/:$/, '') });
      else if (nome) ingredientes.push({ nome, peso: null, gramas: null, medida: medida || null });
      else if (ingredientes.length && !ingredientes.at(-1).secao) ingredientes.at(-1).medida = limpar(`${ingredientes.at(-1).medida ?? ''} ${medida}`);
      else avisar(n, `medida sem ingrediente: "${medida}"`);
      continue;
    }
    const partes = linhasDe.get(e.ancora);
    const nome = juntar(partes, 'nome');
    if (!nome) avisar(n, `ingrediente sem nome: ${e.ancora.peso.s}`);
    const lido = pesoLido(e.ancora.peso);
    if (!ehQuantidade(limpar(e.ancora.peso.s))) notas.push(`peso impresso como "${limpar(e.ancora.peso.s)}" (lido como "${lido}")`);
    const q = quantidade(lido);
    ingredientes.push({
      nome,
      peso: q.texto,
      gramas: q.unidade === 'kg' || q.unidade === 'l' ? q.valor * 1000 : q.valor,
      medida: juntar(partes, 'medida') || null,
    });
  }

  const partes = (rotulo) => {
    const its = itens.filter((i) => Math.abs(i.y - rotulo.y) < 2.5 && i.x > rotulo.x + 10 && i.x < rotulo.x + 220).sort((a, b) => a.x - b.x);
    const peso = its.find((i) => ehQuantidade(i.s));
    const resto = limpar(its.filter((i) => i !== peso).map((i) => i.s).join(' '));
    return { peso: peso ? quantidade(peso.s).texto : null, medida: resto || null };
  };
  const rend = partes(rendimento);
  const porc = partes(porcao);

  // Informação nutricional (por porção), no painel da direita.
  const nutricao = {};
  const limitePainel = rendimentoNoPainel ? rendimento.y - 3 : rotuloModo.y - 5;
  const lado = itens.filter((i) => i.x >= xPainel && i.y > rotuloInfo.y + 8 && i.y < limitePainel);
  const valores = lado.filter((i) => i.x > xPainel + 60 && (/^[\d.,]+\s*(kcal|g|mg)?$/i.test(limpar(i.s)) || /^zero$/i.test(limpar(i.s))));
  const rotulos = linhas(lado.filter((i) => i.x <= xPainel + 60), 1).map((g) => ({ y: g.y, s: textoDaLinha(g) }));
  const juntos = [];
  for (const r of rotulos) {
    const ant = juntos.at(-1);
    if (ant && /^Gorduras$/i.test(ant.s) && /^saturadas/i.test(r.s)) {
      ant.s = 'Gorduras saturadas';
      ant.y = (ant.y + r.y) / 2;
    } else juntos.push({ ...r });
  }
  for (const v of valores) {
    const rotulo = juntos.reduce((melhor, r) => (Math.abs(r.y - v.y) < Math.abs(melhor.y - v.y) ? r : melhor), juntos[0]);
    const chave = ROTULOS.find(([nome]) => semAcento(rotulo?.s ?? '') === nome)?.[1];
    if (!chave) {
      avisar(n, `valor nutricional sem rótulo conhecido: "${rotulo?.s}" = ${v.s}`);
      continue;
    }
    if (nutricao[chave] !== undefined) avisar(n, `rótulo repetido: ${chave}`);
    nutricao[chave] = /^zero$/i.test(limpar(v.s)) ? 0 : numeroBr(v.s);
    if (chave === 'sodio' && !/mg$/i.test(limpar(v.s))) {
      if (SODIO_EM_GRAMAS.has(pagina)) {
        nutricao.sodio = Math.round(nutricao.sodio * 1000);
        notas.push(`sódio impresso como "${limpar(v.s)}": em gramas, pelo charque da receita (lido como ${nutricao.sodio} mg)`);
      } else notas.push(`sódio impresso como "${limpar(v.s)}" (lido como mg)`);
    }
  }
  for (const [, chave] of ROTULOS) if (nutricao[chave] === undefined) avisar(n, `sem ${chave}`);

  // Modo de preparo: duas colunas, passos numerados, às vezes em seções ("Massa:", "Calda:").
  const doModo = itens.filter((i) => i.y > rotuloModo.y + 5 && i.y < 690 && i.t < 12);
  const x0 = Math.min(...doModo.map((i) => i.x));
  const inicios = doModo.filter((i) => /^\d{1,2}\.?$|^\d{1,2}\.\s/.test(i.s.trim()) || /^[A-Za-zÀ-ú’' ]{2,30}:$/.test(i.s.trim()));
  const direita = inicios.filter((i) => i.x > x0 + 120);
  const meio = direita.length ? Math.min(...direita.map((i) => i.x)) - 3 : Infinity;
  const preparo = [{ titulo: null, passos: [] }];
  // Às vezes o passo seguinte começa no meio da linha ("rechear e fechar; 2. Em uma").
  const acrescentar = (secao, texto) => {
    const ultimo = secao.passos.at(-1);
    const juntado = /-$/.test(ultimo.texto) ? ultimo.texto + texto : `${ultimo.texto} ${texto}`;
    const quebra = juntado.match(new RegExp(`^(.*[;.])\\s+${ultimo.numero + 1}\\.\\s+(.*)$`));
    if (quebra) {
      ultimo.texto = quebra[1];
      secao.passos.push({ numero: ultimo.numero + 1, texto: quebra[2] });
    } else ultimo.texto = juntado;
  };
  for (const coluna of [doModo.filter((i) => i.x < meio), doModo.filter((i) => i.x >= meio)]) {
    for (const g of linhas(coluna)) {
      const t = textoDaLinha(g);
      const secao = preparo.at(-1);
      const passo = t.match(/^(\d{1,2})\.\s*(.*)$/);
      if (/^[A-Za-zÀ-ú’' ]{2,30}:$/.test(t)) {
        if (secao.passos.length || secao.titulo) preparo.push({ titulo: t.replace(/:$/, ''), passos: [] });
        else secao.titulo = t.replace(/:$/, '');
      } else if (passo) {
        secao.passos.push({ numero: Number(passo[1]), texto: '' });
        if (passo[2]) acrescentar(secao, passo[2]);
      } else if (secao.passos.length) acrescentar(secao, t);
      else avisar(n, `texto fora de passo: "${t}"`);
    }
  }
  for (const secao of preparo) {
    secao.passos.forEach((p, i) => {
      if (p.numero !== i + 1) avisar(n, `passo fora de ordem${secao.titulo ? ` (${secao.titulo})` : ''}: esperado ${i + 1}, veio ${p.numero}`);
    });
  }
  if (!preparo.some((s) => s.passos.length)) avisar(n, 'modo de preparo vazio');

  return {
    id: pagina,
    nome: doIndice?.nome ?? null,
    regiao: doIndice?.regiao ?? null,
    tipo: tituloCurto(tipo),
    ingredientes,
    rendimento: rend,
    porcao: porc,
    nutricao,
    preparo: preparo.filter((s) => s.passos.length).map((s) => ({ titulo: s.titulo, passos: s.passos.map((p) => limpar(p.texto)) })),
    notas,
    paginaPdf: n,
  };
}

const fichas = Object.keys(paginas)
  .map(Number)
  .filter((n) => itensDe(n).some((i) => i.s.includes('TIPO DE PREPARA')) && !itensDe(n).some((i) => i.s.includes('XXXXX')));
const receitas = fichas.map(ficha).filter(Boolean);
const usados = new Set(receitas.map((r) => r.id));
for (const [pagina, { nome }] of indice) if (!usados.has(pagina)) problemas.push(`índice sem ficha: ${nome} (pág. ${pagina})`);
fs.writeFileSync(saida, JSON.stringify(receitas, null, 1));

// Arquivo do site: sem as notas de leitura e com os ajustes de texto abaixo.
const textoLimpo = (s) =>
  s
    ?.replace(/-\s+(?=\p{Ll})/gu, '-') // "Marmelada-de- cachorro": quebra de linha depois do hífen
    .replace(/porçõess/g, 'porções'); // erro de digitação no livro (Doce em pasta de graviola)
const site = {
  fonte: {
    titulo: 'Alimentos Regionais Brasileiros',
    edicao: 'Ministério da Saúde, 2ª edição, 2015',
    url: 'https://bvsms.saude.gov.br/bvs/publicacoes/alimentos_regionais_brasileiros_2ed.pdf',
    licenca: 'CC BY-NC-SA 4.0',
    licencaUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br',
  },
  receitas: receitas
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((r) => ({
      id: r.id,
      nome: r.nome,
      regiao: r.regiao,
      tipo: r.tipo.replace(/\/\s+/g, '/'),
      ingredientes: r.ingredientes.map((i) => (i.secao ? { secao: textoLimpo(i.secao) } : { ...i, nome: textoLimpo(i.nome), medida: textoLimpo(i.medida) })),
      rendimento: { peso: r.rendimento.peso, medida: textoLimpo(r.rendimento.medida) },
      porcao: { peso: r.porcao.peso, medida: textoLimpo(r.porcao.medida) },
      nutricao: r.nutricao,
      preparo: r.preparo.map((s) => ({ titulo: s.titulo, passos: s.passos.map(textoLimpo) })),
      pagina: r.id,
    })),
};
if (saidaDoSite) fs.writeFileSync(saidaDoSite, `${JSON.stringify(site)}\n`);
console.log('fichas:', fichas.length, '| receitas:', receitas.length, '| no índice:', indice.size);
console.log('problemas:', problemas.length);
for (const p of problemas) console.log(' -', p);
