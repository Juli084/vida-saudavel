// Uso: node arb-conferir.cjs <receitas.json>
// Conferências da extração: energia x macronutrientes, tipos, regiões e nome x ingredientes.
const r = require(require('path').resolve(process.argv[2]));
const sem = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
console.log('receitas:', r.length);
console.log('tipos:', [...new Set(r.map((x) => x.tipo))].join(' | '));
console.log('regiões:', Object.entries(r.reduce((a, x) => ((a[x.regiao] = (a[x.regiao] || 0) + 1), a), {})).join(' | '));
let fora = 0;
for (const x of r) {
  const n = x.nutricao;
  const est = 4 * n.carboidrato + 4 * n.proteina + 9 * n.gorduras;
  if (Math.abs(est - n.energia) / n.energia > 0.15) {
    fora++;
    console.log('energia:', x.id, x.nome, n.energia, 'estimada', est.toFixed(1));
  }
}
console.log('energia fora de 15%:', fora);
const genericas = new Set(['molho', 'bolo', 'arroz', 'doce', 'salada', 'sopa', 'pudim', 'farofa', 'refogado', 'geleia', 'chimia', 'frango', 'peixe', 'cozido', 'pasta', 'recheado', 'recheada', 'assado', 'cremoso', 'nordestina', 'nordestino', 'maranhense', 'goiano', 'paulista', 'capixaba', 'docinho', 'biscoitinho', 'compota', 'musse', 'mingau', 'gelado', 'gratinado', 'surpresa', 'falso', 'torta', 'cuca', 'vitamina', 'manjar', 'quibebe', 'monjica', 'acorda', 'angu', 'escondidinho', 'frigideira', 'tapioca', 'cartola', 'rocambole', 'pierogui', 'barreado', 'charuto', 'dobradinha', 'cozidao', 'empadao', 'mungunza', 'rubacao', 'umbuzada', 'pacoca', 'rabada', 'caldeirada', 'peixada', 'vatapa', 'quirera', 'galinhada', 'caldo', 'verde', 'brasileirinho', 'tropeiro', 'casaca', 'regional', 'roxo']);
for (const x of r) {
  const palavras = sem(x.nome).split(/[^a-z]+/).filter((w) => w.length >= 4 && !genericas.has(w));
  const corpo = sem(JSON.stringify(x.ingredientes) + JSON.stringify(x.preparo));
  if (palavras.length && !palavras.some((w) => corpo.includes(w.slice(0, 5)))) console.log('nome x ingredientes?', x.id, x.nome, '|', x.ingredientes.slice(0, 5).map((i) => i.nome || `[${i.secao}]`).join(', '));
}
const ing = r.flatMap((x) => x.ingredientes.filter((i) => !i.secao));
console.log('ingredientes:', ing.length, '| sem peso:', ing.filter((i) => !i.peso).length, '| sem medida:', ing.filter((i) => !i.medida).length);
console.log('com notas:', r.filter((x) => x.notas.length).length);
