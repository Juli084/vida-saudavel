# De onde vêm os números

## Composição dos alimentos: TACO

**Fonte:** Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição revisada e ampliada.
NEPA/UNICAMP, Campinas, 2011. São 597 alimentos em 15 grupos, com valores por 100 g de parte
comestível.

**Reprodução:** a própria publicação diz: "É permitida a reprodução parcial ou total desta obra,
desde que citada a fonte". A fonte aparece no rodapé do site, na ficha de cada alimento e no
resumo copiado do prato.

**Arquivo usado:** o PDF da 4ª edição, que o Conselho Federal de Nutricionistas disponibiliza
em
[cfn.org.br](https://cfn.org.br/wp-content/uploads/2017/03/taco_4_edicao_ampliada_e_revisada.pdf).
Os links do site do NEPA estavam fora do ar na data da extração (19/11/2026).

- Tamanho: 744.346 bytes, 164 páginas.
- SHA-256: `2002aec5615b5b1395aaa8fa675635bbb7f712c33f278af5e332f1cac8f108c8`

### Como os dados foram extraídos

```bash
pdftotext -table -enc UTF-8 taco.pdf taco-tab.txt     # xpdf 4.00
node scripts/taco/extrair.cjs taco-tab.txt taco-completa.json src/alimentos/taco.json
node scripts/taco/conferir.cjs taco-completa.json
```

- **Páginas da Tabela 1:** ficam em pares. Uma tem a composição centesimal, com energia,
  proteína, lipídeos, carboidrato, fibra, cálcio e magnésio. A outra tem minerais e vitaminas.
- **Tabela 2:** dela saem só os ácidos graxos saturados, mono e poli-insaturados.
- **Colunas:** cada coluna é localizada pela posição da unidade, como `(mg)`, no cabeçalho da
  página. Cada valor vai para uma coluna, na ordem, pela menor soma de distâncias até o início das
  colunas. Assim, uma linha um pouco deslocada no PDF não troca valores de coluna.

### Como os dados foram conferidos

- **Alimentos e grupos:**
  - os 597 alimentos estão lá, com números de 1 a 597;
  - a contagem por grupo bate com a da publicação: 63 cereais, 99 verduras, 96 frutas, 14
    gorduras, 50 pescados, 123 carnes, 24 leites, 14 bebidas, 7 ovos, 20 produtos açucarados, 9
    miscelâneas, 5 industrializados, 32 preparados, 30 leguminosas e 11 nozes e sementes.
- **Energia em kJ:** fica a até 2% de kcal × 4,184 em todos os alimentos.
- **Energia × composição:** a energia fica perto de 4 kcal/g de proteína e de carboidrato e 9
  kcal/g de lipídeos. Isso vale para todos, menos as bebidas alcoólicas (o álcool tem energia
  própria) e o fermento químico, cuja diferença está na própria tabela.
- **Linha a linha:** os testes em `tests/alimentos.test.ts` comparam valores copiados do PDF em
  alimentos de várias páginas, inclusive de linhas que vieram deslocadas na extração.
- **Diferenças da própria fonte:** os casos que a conferência aponta foram checados contra o PDF
  e são da TACO, não da extração. Por exemplo, o leite de vaca líquido tem "*" (amostras em
  análise) na energia e nos macronutrientes, e os óleos não têm minerais analisados.

### Como os valores aparecem

| Na TACO | No site | Nas contas |
|---|---|---|
| número | o número | o número |
| `Tr` (traço) | "traços" | zero |
| `NA`, `*` ou vazio | "–" | fica de fora; o total do prato avisa que é parcial |

## Valores diários de referência: Anvisa

**Fonte:** Instrução Normativa nº 75, de 8 de outubro de 2020, Anexo II (valores diários de
referência para a rotulagem nutricional, população acima de 3 anos). São os mesmos usados no
rótulo dos alimentos.

| Nutriente | VDR | Nutriente | VDR |
|---|---|---|---|
| Energia | 2.000 kcal | Cálcio | 1.000 mg |
| Carboidratos | 300 g | Ferro | 14 mg |
| Proteínas | 50 g | Potássio | 3.500 mg |
| Gorduras totais | 65 g | Magnésio | 420 mg |
| Gorduras saturadas | 20 g | Zinco | 11 mg |
| Fibra alimentar | 25 g | Fósforo | 700 mg |
| Sódio | 2.000 mg | Vitamina C | 100 mg |
| Colesterol | 300 mg | Vitamina A | 800 µg RAE |
| Tiamina | 1,2 mg | Riboflavina | 1,2 mg |
| Vitamina B6 | 1,3 mg | | |

**Niacina:** aparece sem %VD. A TACO dá a niacina pré-formada, e a referência da Anvisa é em
equivalentes de niacina, que incluem o que o corpo converte do triptofano.

## Sugestões

As sugestões ordenam os alimentos pelo nutriente escolhido, por 100 g ou por 100 kcal. Algumas
regras deixam a lista útil:

- **Grupos fora:** miscelâneas (sal, fermento, temperos), produtos açucarados, bebidas, óleos e
  "outros alimentos industrializados".
- **Crus fora:** cereal, leguminosa, carne, peixe e ovo crus, porque o que se come é a versão
  cozida que a tabela também traz. A aveia em flocos é exceção.
- **Concentrados e ultraprocessados fora:** desidratados, alimentos em pó, farinhas, misturas
  prontas, embutidos, empanados, pão de forma, biscoitos, bolos, cereal matinal, sucos envasados e
  extratos. Por 100 g eles ganhariam de tudo, e o Guia Alimentar recomenda evitar os
  ultraprocessados.
- **Doces de fruta e enlatados fora:** frutas em calda, em barra, em pasta ou com xarope, e
  enlatados. A "batata, doce" continua, porque ali "doce" é o nome da batata.

As mesmas regras ordenam a busca: entre os alimentos com o nome pesquisado, os que entrariam nas
sugestões aparecem primeiro. Quem busca "banana" vê as bananas cruas antes da banana em barra.

A ordem é a da tabela. Ela não recomenda dieta nem quantidade, e não substitui orientação de
nutricionista.
