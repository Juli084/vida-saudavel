/*
 * Os dez passos do Guia Alimentar para a População Brasileira (Ministério da Saúde, 2014).
 * Os títulos seguem o guia; as explicações são resumos meus, com o link para o original.
 */

export const GUIA_ALIMENTAR = {
  titulo: 'Guia Alimentar para a População Brasileira',
  edicao: 'Ministério da Saúde, 2ª edição, 2014',
  url: 'https://bvsms.saude.gov.br/bvs/publicacoes/guia_alimentar_populacao_brasileira_2ed.pdf',
};

export const DEZ_PASSOS: { titulo: string; resumo: string }[] = [
  {
    titulo: 'Fazer de alimentos in natura ou minimamente processados a base da alimentação',
    resumo: 'Arroz, feijão, legumes, verduras, frutas, ovos, carnes e leite, comprados como vêm da natureza ou quase.',
  },
  {
    titulo: 'Usar óleos, gorduras, sal e açúcar em pequenas quantidades',
    resumo: 'Eles temperam e cozinham a comida; o problema é o excesso.',
  },
  {
    titulo: 'Limitar o consumo de alimentos processados',
    resumo: 'Conservas, queijos, pães e frutas em calda entram como parte de refeições, não como base delas.',
  },
  {
    titulo: 'Evitar o consumo de alimentos ultraprocessados',
    resumo: 'Refrigerantes, biscoitos recheados, salgadinhos de pacote e refeições prontas congeladas.',
  },
  {
    titulo: 'Comer com regularidade e atenção, em ambientes apropriados e, sempre que possível, com companhia',
    resumo: 'Refeição em horário parecido, sem tela e sem pressa.',
  },
  {
    titulo: 'Fazer compras em locais que ofertem variedades de alimentos in natura ou minimamente processados',
    resumo: 'Feiras, sacolões e mercados municipais costumam ter mais variedade e preço melhor.',
  },
  {
    titulo: 'Desenvolver, exercitar e partilhar habilidades culinárias',
    resumo: 'Cozinhar é o jeito mais direto de comer comida de verdade.',
  },
  {
    titulo: 'Planejar o uso do tempo para dar à alimentação o espaço que ela merece',
    resumo: 'Planejar as refeições da semana e as compras é o que este site ajuda a fazer.',
  },
  {
    titulo: 'Dar preferência, quando fora de casa, a locais que servem refeições feitas na hora',
    resumo: 'Restaurantes por quilo e comida feita na hora no lugar de fast food.',
  },
  {
    titulo: 'Ser crítico quanto a informações, orientações e mensagens sobre alimentação veiculadas em propagandas comerciais',
    resumo: 'Propaganda tem o objetivo de vender, não de informar.',
  },
];
