import { describe, expect, it } from 'vitest';
import taco from '../src/alimentos/taco.json' with { type: 'json' };
import {
  buscar,
  entraNasSugestoes,
  formatarPercentual,
  formatarValor,
  naPorcao,
  nutriente,
  NUTRIENTES,
  OBJETIVOS,
  percentualDoVd,
  semAcento,
  sugerir,
  totalDoPrato,
  valorNaBase,
  type Alimento,
  type Tabela,
} from '../src/alimentos/dados.ts';
import { lerPrato } from '../src/alimentos/prato.ts';

const tabela = taco as Tabela;
const porId = new Map(tabela.alimentos.map((a) => [a.id, a]));
const alimento = (id: number) => porId.get(id)!;

describe('tabela extraída da TACO', () => {
  it('tem os 597 alimentos, ids de 1 a 597 e os 15 grupos', () => {
    expect(tabela.alimentos).toHaveLength(597);
    expect(tabela.alimentos.map((a) => a.id)).toEqual(Array.from({ length: 597 }, (_, i) => i + 1));
    expect(tabela.grupos).toHaveLength(15);
    for (const a of tabela.alimentos) expect(tabela.grupos[a.grupo], `${a.id}`).toBeDefined();
  });

  it('confere valores publicados na TACO, linha por linha', () => {
    // Valores copiados da 4ª edição (págs. 29-30, 37-38 e 45-46), para pegar troca de coluna.
    expect(alimento(1)).toMatchObject({ nome: 'Arroz, integral, cozido', energia: 124, proteina: 2.6, lipideos: 1, carboidrato: 25.8, fibra: 2.7, calcio: 5, magnesio: 59, fosforo: 106, ferro: 0.3, sodio: 1, potassio: 75, zinco: 0.7 });
    expect(alimento(7)).toMatchObject({ nome: 'Aveia, flocos, crua', energia: 394, proteina: 13.9, fibra: 9.1, ferro: 4.4, tiamina: 0.55, riboflavina: 0.03, piridoxina: 'Tr', niacina: 4.47, vitaminaC: 1.4 });
    expect(alimento(182)).toMatchObject({ nome: 'Banana, prata, crua', energia: 98, carboidrato: 26, fibra: 2, potassio: 358, vitaminaC: 21.6, vitaminaA: 16, sodio: 'Tr' });
    expect(alimento(547)).toMatchObject({ nome: 'Salpicão, de frango', sodio: 248, tiamina: 0.05, riboflavina: 'Tr', piridoxina: 'Tr', niacina: 1.48, vitaminaC: 9.3 });
  });

  it('mantém o que a TACO marca como não analisado (*) ou não aplicável (NA) sem número inventado', () => {
    const leite = tabela.alimentos.find((a) => a.nome === 'Leite, de vaca, integral')!;
    expect(leite.energia).toBeNull();
    expect(leite.calcio).toBe(123);
    expect(alimento(182).colesterol).toBeNull();
  });

  it('tem coerência interna: energia perto de 4 kcal por g de proteína e carboidrato e 9 por g de gordura', () => {
    const n = (v: Alimento['energia']) => (typeof v === 'number' ? v : 0);
    const fora = tabela.alimentos.filter((a) => {
      if (typeof a.energia !== 'number' || /aguardente|cerveja|vinho|caipirinha|fermento/i.test(a.nome)) return false;
      const estimado = 4 * n(a.proteina) + 4 * n(a.carboidrato) + 9 * n(a.lipideos);
      return Math.abs(estimado - a.energia) > Math.max(25, a.energia * 0.2);
    });
    expect(fora.map((a) => a.nome)).toEqual([]);
  });
});

describe('busca', () => {
  it('acha sem acento, em qualquer ordem, e põe o cozido antes do cru', () => {
    expect(semAcento('Feijão')).toBe('feijao');
    const resultado = buscar(tabela.alimentos, 'feijao preto');
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado.every((a) => /feij[aã]o/i.test(a.nome) && /preto/i.test(a.nome))).toBe(true);
    expect(resultado[0]!.nome).toMatch(/cozido/);
    expect(buscar(tabela.alimentos, 'xyz123')).toEqual([]);
  });

  it('filtra pelo grupo', () => {
    const frutas = tabela.grupos.indexOf('Frutas e derivados');
    const resultado = buscar(tabela.alimentos, '', frutas);
    expect(resultado).toHaveLength(96);
    expect(resultado.every((a) => a.grupo === frutas)).toBe(true);
  });
});

describe('porção e valor diário', () => {
  it('calcula a porção a partir dos 100 g da tabela e o %VD da Anvisa', () => {
    const fibra = nutriente('fibra');
    expect(fibra.vd).toBe(25);
    expect(naPorcao(2.7, 150)).toBeCloseTo(4.05);
    expect(percentualDoVd(5, fibra)).toBe(20);
    expect(naPorcao('Tr', 200)).toBe('Tr');
    expect(percentualDoVd('Tr', fibra)).toBe(0);
    expect(percentualDoVd(null, fibra)).toBeNull();
    expect(percentualDoVd(10, nutriente('niacina'))).toBeNull();
  });

  it('usa os valores diários do Anexo II da IN 75/2020', () => {
    const vds = Object.fromEntries(NUTRIENTES.map((n) => [n.chave, n.vd]));
    expect(vds).toMatchObject({ energia: 2000, carboidrato: 300, proteina: 50, lipideos: 65, saturados: 20, fibra: 25, sodio: 2000, colesterol: 300, calcio: 1000, ferro: 14, potassio: 3500, magnesio: 420, zinco: 11, fosforo: 700, vitaminaC: 100, vitaminaA: 800 });
  });

  it('formata em português, com traços e sem dado', () => {
    expect(formatarValor(124, 'kcal')).toBe('124 kcal');
    expect(formatarValor(2.7, 'g')).toBe('2,7 g');
    expect(formatarValor(0.55, 'mg')).toBe('0,55 mg');
    expect(formatarValor('Tr', 'mg')).toBe('traços');
    expect(formatarValor(null, 'mg')).toBe('–');
    expect(formatarPercentual(0.4)).toBe('menos de 1%');
    expect(formatarPercentual(19.6)).toBe('20%');
  });
});

describe('sugestões', () => {
  it('ordena pelo nutriente e só sugere o que se come: nada cru de cereal, feijão ou carne, nem sal e doces', () => {
    for (const objetivo of OBJETIVOS) {
      const lista = sugerir(tabela, objetivo);
      expect(lista.length, objetivo.id).toBe(12);
      const valores = lista.map((a) => a[objetivo.chave] as number);
      const ordenados = [...valores].sort((a, b) => (objetivo.ordem === 'maior' ? b - a : a - b));
      expect(valores, objetivo.id).toEqual(ordenados);
      for (const a of lista) expect(entraNasSugestoes(a, tabela.grupos), a.nome).toBe(true);
    }
    const fibra = sugerir(tabela, OBJETIVOS.find((o) => o.id === 'fibra')!);
    expect(fibra.some((a) => /feij[aã]o.*cru/i.test(a.nome))).toBe(false);
    expect(fibra.some((a) => /^sal\b/i.test(a.nome))).toBe(false);
  });

  it('deixa de fora concentrados e ultraprocessados, que ganhariam por 100 g', () => {
    const fora = ['Coentro, folhas desidratadas', 'Leite, de vaca, integral, pó', 'Soja, farinha', 'Hambúrguer, bovino, frito', 'Pão, glúten, forma'];
    for (const nome of fora) {
      const a = tabela.alimentos.find((x) => x.nome === nome);
      expect(a, nome).toBeDefined();
      expect(entraNasSugestoes(a!, tabela.grupos), nome).toBe(false);
    }
    const vitaminaC = sugerir(tabela, OBJETIVOS.find((o) => o.id === 'vitaminaC')!, null, 3);
    expect(vitaminaC.map((a) => a.nome)).toEqual(['Acerola, crua', 'Acerola, polpa, congelada', 'Caju, cru']);
  });

  it('compara também por 100 kcal, e "menos calorias" fica sempre por 100 g', () => {
    const banana = alimento(182);
    expect(valorNaBase(banana, 'potassio', '100g')).toBe(358);
    expect(valorNaBase(banana, 'potassio', '100kcal')).toBeCloseTo((358 / 98) * 100);
    const proteina = sugerir(tabela, OBJETIVOS.find((o) => o.id === 'proteina')!, null, 5, '100kcal');
    const densidades = proteina.map((a) => valorNaBase(a, 'proteina', '100kcal')!);
    expect(densidades).toEqual([...densidades].sort((a, b) => b - a));
    const calorias = OBJETIVOS.find((o) => o.id === 'calorias')!;
    expect(sugerir(tabela, calorias, null, 5, '100kcal')).toEqual(sugerir(tabela, calorias, null, 5, '100g'));
  });

  it('limita ao grupo escolhido', () => {
    const verduras = tabela.grupos.indexOf('Verduras, hortaliças e derivados');
    const lista = sugerir(tabela, OBJETIVOS.find((o) => o.id === 'vitaminaC')!, verduras, 5);
    expect(lista).toHaveLength(5);
    expect(lista.every((a) => a.grupo === verduras)).toBe(true);
  });
});

describe('prato', () => {
  it('soma os nutrientes pelas gramas e conta quem não tem o dado', () => {
    const totais = totalDoPrato(
      [
        { id: 1, gramas: 150 },
        { id: 182, gramas: 100 },
      ],
      porId,
    );
    expect(totais.energia.valor).toBeCloseTo(124 * 1.5 + 98);
    expect(totais.fibra.valor).toBeCloseTo(2.7 * 1.5 + 2);
    // O arroz integral tem saturados na Tabela 2; a banana, não.
    expect(totais.saturados.semDado).toBe(1);
  });

  it('confere o prato salvo: descarta item inválido e repetido, e limita as gramas', () => {
    const salvo = JSON.stringify([{ id: 1, gramas: 150 }, { id: 1, gramas: 50 }, { id: 'x', gramas: 10 }, { id: 182, gramas: 99999 }, { id: 7, gramas: 0 }]);
    expect(lerPrato(salvo)).toEqual([
      { id: 1, gramas: 150 },
      { id: 182, gramas: 2000 },
      { id: 7, gramas: 1 },
    ]);
    expect(lerPrato('lixo')).toEqual([]);
  });
});
