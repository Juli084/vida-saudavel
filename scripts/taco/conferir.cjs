// Uso: node scripts/taco/conferir.cjs <taco-completa.json>
// Confere a extração: ids completos, grupos, colunas presentes e a coerência interna da TACO
// (kJ ≈ kcal × 4,184 e kcal próximas de 4·proteína + 4·carboidrato + 9·lipídeos).
const fs = require('fs');
const lista = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const num = (v) => (typeof v === 'number' ? v : v === 'Tr' ? 0 : null);
const problemas = [];

const ids = new Set(lista.map((a) => a.id));
for (let i = 1; i <= 597; i++) if (!ids.has(i)) problemas.push(`falta o alimento ${i}`);
const grupos = {};
for (const a of lista) {
  if (!a.nome) problemas.push(`${a.id}: sem nome`);
  if (!a.grupo) problemas.push(`${a.id}: sem grupo`);
  grupos[a.grupo] = (grupos[a.grupo] ?? 0) + 1;
  for (const c of ['umidade', 'energiaKcal', 'energiaKj', 'proteina', 'lipideos', 'carboidrato', 'fibra', 'calcio', 'ferro', 'sodio', 'potassio']) {
    if (!(c in a)) problemas.push(`${a.id} ${a.nome}: sem a coluna ${c}`);
  }
  const kcal = num(a.energiaKcal);
  const kj = num(a.energiaKj);
  if (kcal != null && kj != null && Math.abs(kj - kcal * 4.184) > Math.max(3, kcal * 0.02)) problemas.push(`${a.id} ${a.nome}: ${kcal} kcal x ${kj} kJ`);
  const p = num(a.proteina) ?? 0;
  const c = num(a.carboidrato) ?? 0;
  const l = num(a.lipideos) ?? 0;
  const estimado = 4 * p + 4 * c + 9 * l;
  const alcoolico = /cerveja|cachaça|vinho|alcoólic|aguardente|caipirinha|uísque|vodka|saquê|batida/i.test(a.nome);
  if (kcal != null && !alcoolico && Math.abs(estimado - kcal) > Math.max(25, kcal * 0.2)) problemas.push(`${a.id} ${a.nome}: ${kcal} kcal, estimado ${estimado.toFixed(0)}`);
  for (const [c2, max] of [['umidade', 100], ['proteina', 100], ['lipideos', 100], ['carboidrato', 100], ['fibra', 100]]) {
    const v = num(a[c2]);
    if (v != null && (v < 0 || v > max)) problemas.push(`${a.id}: ${c2}=${v}`);
  }
  const soma = (num(a.umidade) ?? 0) + p + l + c + (num(a.cinzas) ?? 0);
  if (soma > 0 && Math.abs(soma - 100) > 3 && !alcoolico) problemas.push(`${a.id} ${a.nome}: umidade+macros+cinzas = ${soma.toFixed(1)}`);
}
const comGordura = lista.filter((a) => 'saturados' in a).length;
console.log('alimentos', lista.length, 'com saturados', comGordura);
console.log(grupos);
console.log(problemas.length ? problemas.join('\n') : 'nenhum problema');
