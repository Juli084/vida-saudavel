// Uso: node scripts/receitas-ms/ler.cjs <alimentos_regionais_brasileiros_2ed.pdf> <pasta-de-saida> [public/receitas]
//
// Abre o PDF com o pdf.js num navegador (Playwright) e grava:
// - <pasta-de-saida>/texto-todas.json: o texto de todas as páginas com posição, para o extrair.cjs;
// - [public/receitas]/ms-<página>.webp: a foto de cada receita, se a pasta for informada.
// O pdftotext não serve aqui: ele não dá a posição das palavras, e as fichas têm duas colunas.
// Navegador: o Chromium do Playwright, ou o canal em PW_CHANNEL (por exemplo, msedge).
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('@playwright/test');

const [pdf, saida, pastaFotos] = process.argv.slice(2);
if (!pdf || !saida) {
  console.error('Uso: node scripts/receitas-ms/ler.cjs <livro.pdf> <pasta-de-saida> [public/receitas]');
  process.exit(1);
}

// Servidor local só com as duas coisas de que a página precisa.
const servidor = http.createServer((pedido, resposta) => {
  if (pedido.url === '/ler.html') {
    resposta.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(__dirname, 'ler.html')).pipe(resposta);
  } else if (pedido.url === '/livro.pdf') {
    resposta.writeHead(200, { 'Content-Type': 'application/pdf' });
    fs.createReadStream(pdf).pipe(resposta);
  } else {
    resposta.writeHead(404).end();
  }
});

(async () => {
  await new Promise((pronto) => servidor.listen(0, '127.0.0.1', pronto));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const navegador = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  const pagina = await navegador.newPage();
  await pagina.goto(`${base}/ler.html`);
  const total = await pagina.evaluate((url) => window.abrir(url), `${base}/livro.pdf`);

  const texto = {};
  for (let n = 1; n <= total; n++) texto[n] = await pagina.evaluate((n) => window.texto(n), n);
  fs.mkdirSync(saida, { recursive: true });
  fs.writeFileSync(path.join(saida, 'texto-todas.json'), JSON.stringify(texto));
  console.log('páginas lidas:', total);

  if (pastaFotos) {
    fs.mkdirSync(pastaFotos, { recursive: true });
    // A foto fica na página anterior à ficha técnica; o nome do arquivo usa o número impresso da ficha.
    const fichas = Object.entries(texto).filter(([, p]) => p.itens.some((i) => i.s.includes('TIPO DE PREPARA')) && !p.itens.some((i) => i.s.includes('XXXXX')));
    for (const [n, p] of fichas) {
      const impresso = p.itens.find((i) => i.y > 690 && /^\d{1,3}$/.test(i.s.trim()));
      const url = await pagina.evaluate((n) => window.foto(n, 640, 480, 0.27, 0.72), Number(n) - 1);
      fs.writeFileSync(path.join(pastaFotos, `ms-${impresso.s.trim()}.webp`), Buffer.from(url.split(',')[1], 'base64'));
    }
    console.log('fotos:', fichas.length);
  }
  await navegador.close();
  servidor.close();
})().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
