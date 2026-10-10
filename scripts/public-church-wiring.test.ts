import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

/*
 * Fiacao da pagina publica do perfil de igreja e do mapeamento (R06b, T28).
 *
 * Prova textual: le o fonte de src/app/igrejas/[slug]/page.tsx e de
 * src/lib/public-church-utils.ts e afirma, por expressoes regulares tolerantes
 * a espaco e quebra de linha, o que a pagina passa a buildPublicChurchProfile,
 * as props dos tres componentes do perfil, a ordem em que eles aparecem e que
 * mapPublicChurchDetails repassa features. Nao renderiza nada: o comportamento
 * dos componentes fica em public-church-sections.test.ts e o do modulo puro em
 * public-church-profile.test.ts.
 *
 * Limite conhecido: a prova e textual. Uma fiacao que casa com o padrao mas
 * quebra em execucao passaria aqui.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = readFileSync(resolve(ROOT, "src/app/igrejas/[slug]/page.tsx"), "utf8");
const UTILS = readFileSync(resolve(ROOT, "src/lib/public-church-utils.ts"), "utf8");

const LIB_IMPORT =
  /import\s*\{[^}]*\bbuildPublicChurchProfile\b[^}]*\}\s*from\s*["']@\/lib\/public-church-profile["']/;
const SECTIONS_IMPORT = /import\s*\{([^}]*)\}\s*from\s*["']@\/components\/site\/church-profile-sections["']/;
const PROFILE_COMPONENTS = ["ChurchProfileMedia", "ChurchProfileAttributes", "ChurchProfileLinks"];

// O bloco e o cartao de endereco existem nas duas versoes (HEAD e working tree).
// O rotulo do endereco muda: "Endereço" literal no HEAD, t("detail.address") na working tree.
const LAYOUT_BLOCK = /<div\s+className="space-y-5"\s*>/;
const ADDRESS_LABEL = /Endere[çc]o|detail\.address/;

function indexAfter(source: string, pattern: RegExp, from = 0): number {
  const found = source.slice(from).search(pattern);
  return found === -1 ? -1 : from + found;
}

function assertInOrder(steps: ReadonlyArray<readonly [string, number]>): void {
  steps.forEach(([label, index], position) => {
    assert.ok(index >= 0, `${label} nao encontrado`);
    if (position > 0) {
      const [previous, previousIndex] = steps[position - 1];
      assert.ok(previousIndex < index, `${previous} deve vir antes de ${label}`);
    }
  });
}

function buildCallBody(source: string): string {
  const match = /buildPublicChurchProfile\s*\(\s*\{([\s\S]*?)\}\s*\)/.exec(source);
  assert.ok(match, "a pagina nao chama buildPublicChurchProfile({ ... })");
  return match[1];
}

function jsxElement(source: string, tag: string): string {
  const match = new RegExp(`<${tag}\\b[\\s\\S]*?/>`).exec(source);
  assert.ok(match, `<${tag} ... /> nao encontrado na pagina`);
  return match[0];
}

function functionBody(source: string, name: string): string {
  const start = source.indexOf(`export function ${name}(`);
  assert.ok(start >= 0, `funcao ${name} nao encontrada`);
  const end = source.indexOf("\nexport ", start + 1);
  return source.slice(start, end === -1 ? undefined : end);
}

describe("pagina publica: chamada de buildPublicChurchProfile", () => {
  test("importa buildPublicChurchProfile de @/lib/public-church-profile", () => {
    assert.match(PAGE, LIB_IMPORT);
  });

  test("importa ChurchProfileMedia, ChurchProfileAttributes e ChurchProfileLinks de @/components/site/church-profile-sections", () => {
    const match = SECTIONS_IMPORT.exec(PAGE);
    assert.ok(match, "a pagina nao importa de @/components/site/church-profile-sections");
    const names = match[1].split(",").map((name) => name.trim());
    for (const component of PROFILE_COMPONENTS) {
      assert.ok(names.includes(component), `${component} nao vem de @/components/site/church-profile-sections`);
    }
  });

  test("recebe features: church.features", () => {
    assert.match(buildCallBody(PAGE), /\bfeatures\s*:\s*church\.features(?![\w.])/);
  });

  test("recebe contact: church.contact", () => {
    assert.match(buildCallBody(PAGE), /\bcontact\s*:\s*church\.contact(?![\w.])/);
  });

  test("recebe thumbnail: church.thumbnail", () => {
    assert.match(buildCallBody(PAGE), /\bthumbnail\s*:\s*church\.thumbnail(?![\w.])/);
  });

  test("recebe photos: church.photos", () => {
    assert.match(buildCallBody(PAGE), /\bphotos\s*:\s*church\.photos(?![\w.])/);
  });

  test("recebe mediaOrigin: process.env.NEXT_PUBLIC_MEDIA_ORIGIN", () => {
    assert.match(buildCallBody(PAGE), /\bmediaOrigin\s*:\s*process\.env\.NEXT_PUBLIC_MEDIA_ORIGIN(?![\w.])/);
  });
});

describe("pagina publica: props dos componentes do perfil", () => {
  test("ChurchProfileMedia recebe name={church.name}", () => {
    assert.match(jsxElement(PAGE, "ChurchProfileMedia"), /\bname\s*=\s*\{\s*church\.name\s*\}/);
  });

  test("ChurchProfileMedia recebe logo={profile.logo}", () => {
    assert.match(jsxElement(PAGE, "ChurchProfileMedia"), /\blogo\s*=\s*\{\s*profile\.logo\s*\}/);
  });

  test("ChurchProfileMedia recebe cover={profile.cover}", () => {
    assert.match(jsxElement(PAGE, "ChurchProfileMedia"), /\bcover\s*=\s*\{\s*profile\.cover\s*\}/);
  });

  test("ChurchProfileMedia recebe gallery={profile.gallery}", () => {
    assert.match(jsxElement(PAGE, "ChurchProfileMedia"), /\bgallery\s*=\s*\{\s*profile\.gallery\s*\}/);
  });

  test("ChurchProfileAttributes recebe features={profile.features}", () => {
    assert.match(jsxElement(PAGE, "ChurchProfileAttributes"), /\bfeatures\s*=\s*\{\s*profile\.features\s*\}/);
  });

  test("ChurchProfileLinks recebe links={profile.links}", () => {
    assert.match(jsxElement(PAGE, "ChurchProfileLinks"), /\blinks\s*=\s*\{\s*profile\.links\s*\}/);
  });

  test("ChurchProfileLinks recebe churchName={church.name}", () => {
    assert.match(jsxElement(PAGE, "ChurchProfileLinks"), /\bchurchName\s*=\s*\{\s*church\.name\s*\}/);
  });
});

describe("pagina publica: ordem dos componentes no layout", () => {
  test("ChurchProfileMedia, ChurchProfileAttributes e ChurchProfileLinks vem nessa ordem logo depois de space-y-5", () => {
    const block = indexAfter(PAGE, LAYOUT_BLOCK);
    const from = Math.max(block, 0);
    assertInOrder([
      ["<div className=\"space-y-5\">", block],
      ["<ChurchProfileMedia", indexAfter(PAGE, /<ChurchProfileMedia\b/, from)],
      ["<ChurchProfileAttributes", indexAfter(PAGE, /<ChurchProfileAttributes\b/, from)],
      ["<ChurchProfileLinks", indexAfter(PAGE, /<ChurchProfileLinks\b/, from)],
    ]);
  });

  test("os tres componentes do perfil vem antes do cartao de Endereco", () => {
    const block = indexAfter(PAGE, LAYOUT_BLOCK);
    const from = Math.max(block, 0);
    assertInOrder([
      ["<ChurchProfileMedia", indexAfter(PAGE, /<ChurchProfileMedia\b/, from)],
      ["<ChurchProfileAttributes", indexAfter(PAGE, /<ChurchProfileAttributes\b/, from)],
      ["<ChurchProfileLinks", indexAfter(PAGE, /<ChurchProfileLinks\b/, from)],
      ["cartao de Endereco", indexAfter(PAGE, ADDRESS_LABEL, from)],
    ]);
  });
});

describe("mapeamento: src/lib/public-church-utils.ts", () => {
  test("mapPublicChurchDetails passa features derivado de church.features", () => {
    assert.match(functionBody(UTILS, "mapPublicChurchDetails"), /\bfeatures\s*:\s*[^\n]*\bchurch\.features\b/);
  });
});
