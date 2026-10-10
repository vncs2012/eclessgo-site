import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { before, describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import type { NetworkKey } from "../src/lib/public-church-profile.ts";

/*
 * Prova por execucao dos componentes do perfil publico (R06b, T27).
 *
 * Os dois fontes sao transpilados com `typescript` para .mjs em
 * node_modules/.cache/r06b-sections/ (ignorado pelo Git): o Node nao remove
 * tipos de arquivos sob node_modules e nao resolve o alias `@/`. O HTML e
 * renderizado com react-dom/server dentro de NextIntlClientProvider, com as
 * mensagens pt-BR reais.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = resolve(ROOT, "node_modules", ".cache", "r06b-sections");
const MODULE_SOURCE = resolve(ROOT, "src/lib/public-church-profile.ts");
const SECTIONS_SOURCE = resolve(ROOT, "src/components/site/church-profile-sections.tsx");
const MESSAGES_SOURCE = resolve(ROOT, "src/messages/pt-BR.json");
const MODULE_FILE = "public-church-profile.mjs";
const SECTIONS_FILE = "church-profile-sections.mjs";
const ALIAS_RE = /(["'])@\/lib\/public-church-profile\1/g;

const IGREJA = "Igreja Central";
const MEDIA = "https://media.example.test/uploads";
const COVER = `${MEDIA}/capa.jpg`;
const LOGO = `${MEDIA}/logo.png`;
const GALLERY = [`${MEDIA}/foto-1.jpg`, `${MEDIA}/foto-2.jpg`];
const FEATURES = ["Estacionamento", "Acessibilidade", "Escola biblica"];
const INSTAGRAM_URL = "https://instagram.com/igrejacentral";
const WEBSITE_URL = "https://igrejacentral.example.test";

type Link = { key: NetworkKey; url: string };
type Attrs = Record<string, string>;

type Sections = {
  ChurchProfileAttributes: (props: { features: string[] }) => React.ReactNode;
  ChurchProfileLinks: (props: { links: Link[]; churchName: string }) => React.ReactNode;
  ChurchProfileMedia: (props: {
    name: string;
    logo: string | null;
    cover: string | null;
    gallery: string[];
  }) => React.ReactNode;
};

const LINKS: Link[] = [
  { key: "instagram", url: INSTAGRAM_URL },
  { key: "website", url: WEBSITE_URL },
];

let sections: Sections;
let messages: Record<string, unknown>;

function transpile(source: string, fileName: string, aliasTarget: string | null): string {
  const result = ts.transpileModule(source, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  assert.equal(result.diagnostics?.length ?? 0, 0, `erro de transpilacao em ${fileName}`);

  if (aliasTarget === null) return result.outputText;

  const rewritten = result.outputText.replace(ALIAS_RE, `"./${aliasTarget}"`);

  assert.notEqual(
    rewritten,
    result.outputText,
    "alias @/lib/public-church-profile nao encontrado",
  );

  return rewritten;
}

// timeZone evita o ENVIRONMENT_FALLBACK do use-intl (erro de console sem fuso configurado).
function render(node: React.ReactNode): string {
  return renderToStaticMarkup(
    React.createElement(NextIntlClientProvider, {
      locale: "pt-BR",
      timeZone: "UTC",
      messages,
      children: node,
    }),
  );
}

function renderLinks(links: Link[]): string {
  return render(React.createElement(sections.ChurchProfileLinks, { links, churchName: IGREJA }));
}

function renderAttributes(features: string[]): string {
  return render(React.createElement(sections.ChurchProfileAttributes, { features }));
}

function renderMedia(logo: string | null, cover: string | null, gallery: string[]): string {
  return render(
    React.createElement(sections.ChurchProfileMedia, { name: IGREJA, logo, cover, gallery }),
  );
}

function attrsOf(raw: string): Attrs {
  const attrs: Attrs = {};

  // React 19 emite referrerPolicy em camelCase; nome de atributo HTML e case-insensitive.
  for (const match of raw.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) {
    attrs[match[1].toLowerCase()] = match[2];
  }

  return attrs;
}

function elementsOf(html: string, tag: string): Attrs[] {
  return [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, "g"))].map((match) =>
    attrsOf(match[1]),
  );
}

function textsOf(html: string, tag: string): string[] {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([^<]*)</${tag}>`, "g"))].map(
    (match) => match[1],
  );
}

before(async () => {
  mkdirSync(CACHE_DIR, { recursive: true });

  const moduleJs = transpile(readFileSync(MODULE_SOURCE, "utf8"), MODULE_SOURCE, null);
  const sectionsJs = transpile(
    readFileSync(SECTIONS_SOURCE, "utf8"),
    SECTIONS_SOURCE,
    MODULE_FILE,
  );

  writeFileSync(resolve(CACHE_DIR, MODULE_FILE), moduleJs);
  writeFileSync(resolve(CACHE_DIR, SECTIONS_FILE), sectionsJs);

  const loaded: unknown = await import(pathToFileURL(resolve(CACHE_DIR, SECTIONS_FILE)).href);

  sections = loaded as Sections;
  messages = JSON.parse(readFileSync(MESSAGES_SOURCE, "utf8")) as Record<string, unknown>;
});

describe("ChurchProfileLinks", () => {
  test("href de cada <a> e a URL recebida, na ordem", () => {
    const anchors = elementsOf(renderLinks(LINKS), "a");

    assert.deepEqual(
      anchors.map((anchor) => anchor.href),
      [INSTAGRAM_URL, WEBSITE_URL],
    );
  });

  test("target=_blank literal em cada <a>", () => {
    const anchors = elementsOf(renderLinks(LINKS), "a");

    assert.deepEqual(
      anchors.map((anchor) => anchor.target),
      ["_blank", "_blank"],
    );
  });

  test("rel=noopener noreferrer nofollow literal em cada <a>", () => {
    const anchors = elementsOf(renderLinks(LINKS), "a");

    assert.deepEqual(
      anchors.map((anchor) => anchor.rel),
      ["noopener noreferrer nofollow", "noopener noreferrer nofollow"],
    );
  });

  test("texto visivel e o nome da rede em pt-BR", () => {
    assert.deepEqual(textsOf(renderLinks(LINKS), "a"), ["Instagram", "Site"]);
  });

  test("aria-label traz a rede e o nome da comunidade", () => {
    const anchors = elementsOf(renderLinks(LINKS), "a");

    assert.deepEqual(
      anchors.map((anchor) => anchor["aria-label"]),
      [
        "Abrir Instagram de Igreja Central (abre em nova aba)",
        "Abrir Site de Igreja Central (abre em nova aba)",
      ],
    );
  });

  test("links aparecem na ordem recebida, sem reordenar", () => {
    const reversed = [...LINKS].reverse();
    const anchors = elementsOf(renderLinks(reversed), "a");

    assert.deepEqual(
      anchors.map((anchor) => anchor.href),
      [WEBSITE_URL, INSTAGRAM_URL],
    );
  });

  test("lista vazia renderiza string vazia", () => {
    assert.equal(renderLinks([]), "");
  });
});

describe("ChurchProfileAttributes", () => {
  test("itens na ordem recebida dentro de um unico <ul>", () => {
    const html = renderAttributes(FEATURES);

    assert.equal(elementsOf(html, "ul").length, 1);
    assert.deepEqual(textsOf(html, "li"), FEATURES);
  });

  test("lista vazia renderiza string vazia", () => {
    assert.equal(renderAttributes([]), "");
  });
});

describe("ChurchProfileMedia", () => {
  test("logo, capa e 2 fotos viram 4 <img> na ordem capa, logo, galeria", () => {
    const images = elementsOf(renderMedia(LOGO, COVER, GALLERY), "img");

    assert.deepEqual(
      images.map((image) => image.src),
      [COVER, LOGO, ...GALLERY],
    );
  });

  test("loading=lazy literal em cada <img>", () => {
    const images = elementsOf(renderMedia(LOGO, COVER, GALLERY), "img");

    assert.deepEqual(
      images.map((image) => image.loading),
      ["lazy", "lazy", "lazy", "lazy"],
    );
  });

  test("decoding=async literal em cada <img>", () => {
    const images = elementsOf(renderMedia(LOGO, COVER, GALLERY), "img");

    assert.deepEqual(
      images.map((image) => image.decoding),
      ["async", "async", "async", "async"],
    );
  });

  test("referrerpolicy=no-referrer literal em cada <img>", () => {
    const images = elementsOf(renderMedia(LOGO, COVER, GALLERY), "img");

    assert.deepEqual(
      images.map((image) => image.referrerpolicy),
      ["no-referrer", "no-referrer", "no-referrer", "no-referrer"],
    );
  });

  test("alt com o nome: capa, logo e fotos com indice a partir de 1", () => {
    const images = elementsOf(renderMedia(LOGO, COVER, GALLERY), "img");

    assert.deepEqual(
      images.map((image) => image.alt),
      [
        "Capa de Igreja Central",
        "Logo de Igreja Central",
        "Foto 1 de Igreja Central",
        "Foto 2 de Igreja Central",
      ],
    );
  });

  test("so galeria: sem alt de logo nem de capa", () => {
    const html = renderMedia(null, null, GALLERY);
    const images = elementsOf(html, "img");

    assert.deepEqual(
      images.map((image) => image.alt),
      ["Foto 1 de Igreja Central", "Foto 2 de Igreja Central"],
    );
    assert.equal(html.includes("Logo de"), false);
    assert.equal(html.includes("Capa de"), false);
  });

  test("sem logo nao gera <img> de logo nem placeholder", () => {
    const images = elementsOf(renderMedia(null, COVER, [GALLERY[0]]), "img");

    assert.deepEqual(
      images.map((image) => image.alt),
      ["Capa de Igreja Central", "Foto 1 de Igreja Central"],
    );
  });

  test("sem logo, capa e galeria renderiza string vazia", () => {
    assert.equal(renderMedia(null, null, []), "");
  });
});

describe("escape do nome da comunidade", () => {
  const HOSTILE = "<script>alert(1)</script>";

  test("nome com script sai escapado no alt da midia", () => {
    const html = render(
      React.createElement(sections.ChurchProfileMedia, {
        name: HOSTILE,
        logo: null,
        cover: COVER,
        gallery: [],
      }),
    );

    assert.equal(html.includes("<script>"), false);
    assert.equal(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), true);
  });

  test("nome com script sai escapado no aria-label dos links", () => {
    const html = render(
      React.createElement(sections.ChurchProfileLinks, {
        links: LINKS,
        churchName: HOSTILE,
      }),
    );

    assert.equal(html.includes("<script>"), false);
    assert.equal(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), true);
  });
});
