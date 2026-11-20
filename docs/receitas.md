# Receitas brasileiras: origem e conferência

As receitas brasileiras do site vêm de um livro do Ministério da Saúde. Este documento diz de onde
vêm, com que licença, como foram extraídas do PDF e o que foi conferido.

## Fonte

- **Livro:** Brasil. Ministério da Saúde. *Alimentos Regionais Brasileiros*. 2ª edição. Brasília:
  Ministério da Saúde, 2015. Feito com a Embrapa e universidades federais.
- **PDF:** [bvsms.saude.gov.br/bvs/publicacoes/alimentos_regionais_brasileiros_2ed.pdf](https://bvsms.saude.gov.br/bvs/publicacoes/alimentos_regionais_brasileiros_2ed.pdf),
  486 páginas, SHA-256
  `152582093c5696cb0ffb895bf164d400da764ded8f06659bdb9f153498017b3f`.
- **Como as receitas foram feitas, segundo o livro (cap. 5):**
  - Foram testadas no Laboratório de Técnica Dietética da Universidade de Brasília.
  - Foram ajustadas para levar menos sal, açúcar e gordura.
  - Foram escolhidas em seis oficinas culinárias regionais, com nutricionistas.
- **Formato:** cada receita é uma ficha técnica de preparo. A ficha traz:
  - os ingredientes, com peso bruto e medida caseira;
  - o rendimento e a porção;
  - a informação nutricional por porção, calculada pelo Ministério com a TACO e outras tabelas
    brasileiras;
  - o modo de preparo.

## Licença

A ficha catalográfica do livro diz que a obra está sob a licença
[Creative Commons Atribuição-NãoComercial-CompartilhaIgual 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br)
e que a reprodução parcial ou total é permitida com citação da fonte.

Os arquivos tirados do livro são uma adaptação e seguem a mesma licença, CC BY-NC-SA 4.0:
- `src/receitas/ministerio.json`;
- `public/receitas/*.webp`, as fotos.

Na prática, a licença pede três coisas:
- **Atribuição:** cada ficha no site cita o livro, a edição, a página e a licença, com o link
  para o PDF.
- **Não comercial:** o site é um projeto de portfólio, sem venda nem anúncio. Num uso comercial,
  essas receitas teriam que sair.
- **Mesma licença:** quem reaproveitar estes dois arquivos precisa manter a CC BY-NC-SA 4.0.

## Extração

O `pdftotext` não serve para estas fichas, por dois motivos:
- **Sem posição das palavras:** ele não informa onde cada palavra está, e a ficha tem duas
  colunas (ingredientes e nutrição) e um modo de preparo também em duas colunas. Sem a posição, a
  medida caseira cai na linha do ingrediente errado.
- **Títulos ilegíveis:** os títulos das receitas usam uma fonte decorativa que não sai como
  texto.

Por isso a extração é feita em três passos:

1. `scripts/receitas-ms/ler.cjs` abre o PDF com o [pdf.js](https://mozilla.github.io/pdf.js/)
   num navegador (Playwright) e grava o texto de todas as páginas com a posição de cada trecho. O
   mesmo script grava a foto de cada receita: a página anterior à ficha, sem a faixa de cima,
   onde fica o título, em 640 × 480 WebP.
2. `scripts/receitas-ms/extrair.cjs` lê cada ficha pelas âncoras da própria página: os rótulos
   "Peso bruto", "INFORMAÇÃO NUTRICIONAL" e "MODO DE PREPARO". As margens mudam entre página par e
   ímpar, então nada usa posição fixa.
   - **Ingredientes:** cada linha com peso é uma âncora. Nome e medida que ocupam duas ou três
     linhas se prendem ao peso mais próximo.
   - **Subtítulos:** "Massa", "Recheio" e outros viram seções. Itens sem peso, como "manteiga e
     farinha para untar", entram como ingrediente sem peso.
   - **Nome e região:** vêm do Apêndice D do livro (lista de preparações por região), pela página
     de cada ficha.
3. `scripts/receitas-ms/conferir.cjs` roda as conferências descritas abaixo.

```bash
PW_CHANNEL=msedge node scripts/receitas-ms/ler.cjs alimentos_regionais_brasileiros_2ed.pdf /tmp/arb public/receitas
node scripts/receitas-ms/extrair.cjs /tmp/arb/texto-todas.json /tmp/arb/conferencia.json src/receitas/ministerio.json
node scripts/receitas-ms/conferir.cjs /tmp/arb/conferencia.json
```

O extrator encerra com um relatório do que não fechou. Na versão atual, ele não aponta nenhum
problema.

## Leituras que pediram decisão

O livro tem alguns erros de impressão. Cada um foi resolvido assim, e o arquivo de conferência
guarda uma nota por ficha:

- **Sódio impresso em "g" (29 fichas).**
  - **Em 27 é mg.** Um doce de fruta não tem 56 g de sódio por porção, e o valor fecha com o sal
    da receita: o "Arroz com pupunha" imprime "291,11 g", e os 3 g de sal em 4 porções já dão
    cerca de 295 mg.
  - **Em 2 é grama mesmo:**
    - "Rubacão" imprime "1,05 g": 200 g de charque e 5 g de sal em 12 porções passam de 1.000 mg.
    - "Escondidinho de abóbora com charque" imprime "1,96 g", com 285 g de charque e 3 g de sal em
      6 porções.

    Lidos como mg, os dois dariam 1 a 2 mg, o que é impossível com charque.
- **Peso sem unidade:**
  - "Doce em pasta de graviola" (300 e 100);
  - "Molho de pitanga" (sete pesos).

  Estão na coluna de peso bruto e foram lidos como gramas.
- **Outros:**
  - **"150 g g"**, em "Salada de lentilha e abobrinha": lido como 150 g.
  - **Gordura trans "Zero"**, em "Pão de jatobá": lido como 0.
  - **"porçõess"**, no rendimento do "Doce em pasta de graviola": corrigido para "porções".
  - **"Marmelada-de- cachorro"**, nome partido no fim da linha: juntado.

## Conferências

- **Contagem:** são 111 fichas, e as 111 estão no Apêndice D, com o mesmo número de página. O texto
  do capítulo 5 fala em 110 preparações, mas o apêndice e as fichas somam 111. Por região: Norte
  20, Nordeste 25, Centro-Oeste 18, Sudeste 26, Sul 22.
- **Títulos:** cada nome do Apêndice D foi conferido a olho contra o título da foto do livro. Os
  111 batem.
- **Energia:** o valor energético de cada ficha foi comparado com 4 kcal por grama de carboidrato e
  de proteína e 9 kcal por grama de gordura. 109 fichas ficam dentro de 15%. Duas passam disso:
  - "Bolo de carambola": 196 kcal na ficha, 166 kcal estimadas;
  - "Molho de tomate": 9,4 kcal na ficha, 7,4 kcal estimadas, um valor pequeno.

  Os valores ficam como estão impressos.
- **Testes:** `tests/receitas.test.ts` confere fichas inteiras contra o livro:
  - "Peixe recheado com castanha e abricó", p. 21;
  - "Pierogui", p. 425, com três seções e um passo que começa no meio da linha.

  Também confere as leituras acima, a coerência da energia, a busca e a existência das 111 fotos.

## No site

- **Carregamento:** as receitas ficam num arquivo à parte, de cerca de 32 KB comprimido, que só é
  baixado depois que a página abre.
- **Busca:**
  - acha pelo nome e pelos ingredientes, sem acento e sem palavras de ligação;
  - mostra primeiro as receitas que têm tudo no nome;
  - quando nenhuma tem todas as palavras, mostra as parecidas: "bolo de milho" mostra os bolos
    primeiro e depois as receitas com milho.
- **Ficha:** traz a informação nutricional por porção do livro, com o %VD da Anvisa (IN
  75/2020). A gordura trans não tem valor diário de referência.
- **Semana e lista de compras:** a receita brasileira pode ir para a semana. A lista de compras
  soma o peso bruto dos ingredientes, sem consultar serviço externo.
