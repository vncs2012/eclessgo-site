import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

/*
 * Fiacao da pagina publica da Comunidade (Modelo 8) e do mapeamento do detalhe.
 *
 * Prova textual: le o fonte de src/app/comunidades/[slug]/page.tsx e de
 * src/lib/public-church-utils.ts e afirma, por expressoes regulares tolerantes a espaco e
 * quebra de linha, o que a pagina passa a buildPublicChurchProfile, a composicao e a ordem
 * das secoes e que mapPublicChurchDetails repassa features. Nao renderiza nada: o
 * comportamento dos componentes fica em public-church-sections.test.ts e o das regras puras
 * em public-church-profile.test.ts e public-community-page.test.ts.
 *
 * Mudanca em relacao a versao anterior: a pagina saiu de src/app/igrejas/[slug] (que agora
 * so existe como redirect 301 em next.config.ts) e o layout antigo de tres cartoes
 * (ChurchProfileMedia/Attributes/Links dentro de space-y-5) foi substituido pelas secoes do
 * Modelo 8; as provas de fiacao das props de buildPublicChurchProfile foram mantidas.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = readFileSync(resolve(ROOT, "src/app/comunidades/[slug]/page.tsx"), "utf8");
const UTILS = readFileSync(resolve(ROOT, "src/lib/public-church-utils.ts"), "utf8");

function indexOf(pattern: RegExp, from = 0): number {
  const found = PAGE.slice(from).search(pattern);
  return found === -1 ? -1 : from + found;
}

function buildCallBody(source: string): string {
  const match = /buildPublicChurchProfile\s*\(\s*\{([\s\S]*?)\}\s*\)/.exec(source);
  assert.ok(match, "a pagina nao chama buildPublicChurchProfile({ ... })");
  return match[1];
}

function jsxElement(tag: string): string {
  const match = new RegExp(`<${tag}\\b[\\s\\S]*?/>`).exec(PAGE);
  assert.ok(match, `<${tag} ... /> nao encontrado na pagina`);
  return match[0];
}

function functionBody(source: string, name: string): string {
  const start = source.indexOf(`export function ${name}(`);
  assert.ok(start >= 0, `funcao ${name} nao encontrada`);
  const end = source.indexOf("\nexport ", start + 1);
  return source.slice(start, end === -1 ? undefined : end);
}

describe("rota oficial: /comunidades/[slug]", () => {
  test("a implementacao antiga em src/app/igrejas/[slug] foi removida", () => {
    assert.equal(existsSync(resolve(ROOT, "src/app/igrejas/[slug]/page.tsx")), false);
  });

  test("canonical e openGraph apontam para /comunidades/<slug>", () => {
    assert.match(PAGE, /canonical:\s*`\/comunidades\/\$\{church\.slug\}`/);
    assert.match(PAGE, /url:\s*`\$\{SITE_URL\}\/comunidades\/\$\{church\.slug\}`/);
    assert.equal(/\/igrejas/.test(PAGE), false);
  });
});

describe("pagina publica: chamada de buildPublicChurchProfile", () => {
  test("importa buildPublicChurchProfile de @/lib/public-church-profile", () => {
    assert.match(
      PAGE,
      /import\s*\{[^}]*\bbuildPublicChurchProfile\b[^}]*\}\s*from\s*["']@\/lib\/public-church-profile["']/,
    );
  });

  for (const [prop, value] of [
    ["features", "church\\.features"],
    ["contact", "church\\.contact"],
    ["thumbnail", "church\\.thumbnail"],
    ["photos", "church\\.photos"],
    ["mediaOrigin", "process\\.env\\.NEXT_PUBLIC_MEDIA_ORIGIN"],
  ]) {
    test(`recebe ${prop}: ${value.replaceAll("\\", "")}`, () => {
      assert.match(buildCallBody(PAGE), new RegExp(`\\b${prop}\\s*:\\s*${value}(?![\\w.])`));
    });
  }
});

describe("pagina publica: props e composicao", () => {
  test("ChurchProfileAttributes recebe features={profile.features}", () => {
    assert.match(jsxElement("ChurchProfileAttributes"), /\bfeatures\s*=\s*\{\s*profile\.features\s*\}/);
  });

  test("ChurchProfileContact recebe links={profile.links} e churchName={church.name}", () => {
    const element = jsxElement("ChurchProfileContact");
    assert.match(element, /\blinks\s*=\s*\{\s*profile\.links\s*\}/);
    assert.match(element, /\bchurchName\s*=\s*\{\s*church\.name\s*\}/);
  });

  test("a capa do hero vem de profile.cover", () => {
    assert.match(jsxElement("CommunityHero"), /\bcover\s*=\s*\{\s*profile\.cover\s*\}/);
  });

  test("as secoes aparecem na ordem do Modelo 8", () => {
    const order = [
      "<CommunityAbout",
      "<CommunitySchedule\\b",
      "<CommunityDirections",
      "<ChurchProfileAttributes",
      "<CommunityPeople",
      "<ChurchProfileContact",
      "<CommunityContribute",
      "<CommunityNearby",
    ].map((pattern) => [pattern, indexOf(new RegExp(pattern))] as const);

    order.forEach(([label, index], position) => {
      assert.ok(index >= 0, `${label} nao encontrado`);
      if (position > 0) assert.ok(order[position - 1][1] < index, `${label} fora de ordem`);
    });
  });

  test("a lista de seções do menu so tem as seções com dado (availableSections)", () => {
    assert.match(PAGE, /availableSections\(\{/);
    for (const id of ["sobre", "horarios", "instalacoes", "contato", "contribuir", "perto"]) {
      assert.match(PAGE, new RegExp(`["']?${id}["']?:\\s`), `${id} sem condicao de existencia`);
    }
  });

  test("PIX so com doacoes ativas E chave (sem ASAAS/checkout)", () => {
    assert.match(PAGE, /church\.donationsEnabled\s*&&\s*Boolean\(church\.pixKey\)/);
    assert.equal(/asaas|checkout/i.test(PAGE), false);
  });

  test("sem contagem regressiva nem 'acontecendo agora'", () => {
    assert.equal(/countdown|contagem|acontecendo agora|happening now/i.test(PAGE), false);
  });

  test("o selo ao vivo so usa a URL de transmissao validada como https", () => {
    assert.match(PAGE, /safeHttpsUrl\(church\.liveUrl\)/);
  });
});

describe("mapeamento: src/lib/public-church-utils.ts", () => {
  test("mapPublicChurchDetails passa features derivado de church.features", () => {
    assert.match(
      functionBody(UTILS, "mapPublicChurchDetails"),
      /\bfeatures\s*:\s*[^\n]*\bchurch\.features\b/,
    );
  });

  test("mapPublicChurchDetails repassa liveUrl e updatedAt so quando a API envia", () => {
    assert.match(UTILS, /mapOptionalDetailFields/);
    assert.match(UTILS, /raw\.live_url/);
    assert.match(UTILS, /raw\.updated_at/);
  });
});
