import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { before, describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import type { NetworkKey } from "../src/lib/public-church-profile.ts";
import { buildCommunityContact, type CommunityContact } from "../src/lib/public-community-page.ts";

/*
 * Prova por execucao das secoes do perfil publico da Comunidade (Modelo 8).
 *
 * O componente e suas dependencias locais (`@/...` e imports relativos) sao transpilados com
 * `typescript` para .mjs em node_modules/.cache/community-sections/ (ignorado pelo Git): o
 * Node nao remove tipos de arquivos sob node_modules nem resolve o alias `@/`. O HTML e
 * renderizado com react-dom/server dentro de NextIntlClientProvider, com as mensagens
 * pt-BR reais. Os componentes testados nao importam `next/*` (o Node ESM nao resolve
 * `next/link` sem extensao).
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = resolve(ROOT, "node_modules", ".cache", "community-sections");
const ENTRY = "src/components/site/church-profile-sections.tsx";
const MESSAGES_SOURCE = resolve(ROOT, "src/messages/pt-BR.json");

const IGREJA = "Igreja Central";
const INSTAGRAM_URL = "https://instagram.com/igrejacentral";
const WEBSITE_URL = "https://igrejacentral.example.test";

type Link = { key: NetworkKey; url: string };
type Attrs = Record<string, string>;

type Sections = {
  ChurchProfileAttributes: (props: { features: string[] }) => React.ReactNode;
  ChurchProfileContact: (props: {
    churchName: string;
    contact: CommunityContact;
    links: Link[];
  }) => React.ReactNode;
};

const LINKS: Link[] = [
  { key: "instagram", url: INSTAGRAM_URL },
  { key: "website", url: WEBSITE_URL },
];
const NO_CONTACT = buildCommunityContact({});
const CONTACT = buildCommunityContact({
  whatsapp: "(62) 90000-0000",
  phone: "(62) 3000-0000",
  email: "contato@igreja.example.test",
});

let sections: Sections;
let messages: Record<string, unknown>;

const compiled = new Map<string, string>();

function resolveSource(from: string, specifier: string): string {
  const base = specifier.startsWith("@/")
    ? resolve(ROOT, "src", specifier.slice(2))
    : resolve(dirname(from), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`]) {
    if (existsSync(candidate) && /\.tsx?$/.test(candidate)) return candidate;
  }
  throw new Error(`nao resolvi ${specifier} a partir de ${from}`);
}

function outputName(source: string): string {
  return `${source.slice(ROOT.length + 1).replace(/[\\/]/g, "__").replace(/\.tsx?$/, "")}.mjs`;
}

/** Transpila `source` e, recursivamente, as dependencias locais; devolve o nome do .mjs. */
function build(source: string): string {
  const name = outputName(source);
  if (compiled.has(source)) return name;
  compiled.set(source, name);

  const result = ts.transpileModule(readFileSync(source, "utf8"), {
    fileName: source,
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  assert.equal(result.diagnostics?.length ?? 0, 0, `erro de transpilacao em ${basename(source)}`);

  const output = result.outputText.replace(
    /(from\s*|import\s*\(\s*)(["'])(@\/[^"']+|\.{1,2}\/[^"']+)\2/g,
    (_match, prefix: string, quote: string, specifier: string) =>
      `${prefix}${quote}./${build(resolveSource(source, specifier))}${quote}`,
  );
  writeFileSync(resolve(CACHE_DIR, name), output);
  return name;
}

// timeZone evita o ENVIRONMENT_FALLBACK do use-intl (erro de console sem fuso configurado).
function render(node: React.ReactNode): string {
  return renderToStaticMarkup(
    React.createElement(
      NextIntlClientProvider,
      { locale: "pt-BR", timeZone: "UTC", messages } as React.ComponentProps<
        typeof NextIntlClientProvider
      >,
      node,
    ),
  );
}

function renderContact(contact: CommunityContact, links: Link[], churchName = IGREJA): string {
  return render(
    React.createElement(sections.ChurchProfileContact, { churchName, contact, links }),
  );
}

function renderAttributes(features: string[]): string {
  return render(React.createElement(sections.ChurchProfileAttributes, { features }));
}

function attrsOf(raw: string): Attrs {
  const attrs: Attrs = {};
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
  const entry = build(resolve(ROOT, ENTRY));
  const loaded: unknown = await import(pathToFileURL(resolve(CACHE_DIR, entry)).href);

  sections = loaded as Sections;
  messages = JSON.parse(readFileSync(MESSAGES_SOURCE, "utf8")) as Record<string, unknown>;
});

describe("ChurchProfileContact: redes", () => {
  const anchors = () => elementsOf(renderContact(NO_CONTACT, LINKS), "a");

  test("href de cada <a> e a URL recebida, na ordem", () => {
    assert.deepEqual(
      anchors().map((anchor) => anchor.href),
      [INSTAGRAM_URL, WEBSITE_URL],
    );
  });

  test("target=_blank literal em cada <a>", () => {
    assert.deepEqual(
      anchors().map((anchor) => anchor.target),
      ["_blank", "_blank"],
    );
  });

  test("rel=noopener noreferrer nofollow literal em cada <a>", () => {
    assert.deepEqual(
      anchors().map((anchor) => anchor.rel),
      ["noopener noreferrer nofollow", "noopener noreferrer nofollow"],
    );
  });

  test("aria-label traz a rede e o nome da comunidade", () => {
    assert.deepEqual(
      anchors().map((anchor) => anchor["aria-label"]),
      [
        "Abrir Instagram de Igreja Central (abre em nova aba)",
        "Abrir Site de Igreja Central (abre em nova aba)",
      ],
    );
  });

  test("texto visivel: rede e @perfil / dominio", () => {
    const html = renderContact(NO_CONTACT, LINKS);
    assert.ok(html.includes("@igrejacentral"));
    assert.ok(html.includes("igrejacentral.example.test"));
  });

  test("links aparecem na ordem recebida, sem reordenar", () => {
    const reversed = elementsOf(renderContact(NO_CONTACT, [...LINKS].reverse()), "a");
    assert.deepEqual(
      reversed.map((anchor) => anchor.href),
      [WEBSITE_URL, INSTAGRAM_URL],
    );
  });
});

describe("ChurchProfileContact: WhatsApp, telefone e e-mail", () => {
  test("WhatsApp abre wa.me em nova aba, com rel seguro", () => {
    const [whatsapp] = elementsOf(renderContact(CONTACT, []), "a");
    assert.equal(whatsapp.href, "https://wa.me/5562900000000");
    assert.equal(whatsapp.target, "_blank");
    assert.equal(whatsapp.rel, "noopener noreferrer nofollow");
    assert.equal(whatsapp["data-track"], "whatsapp");
  });

  test("telefone e e-mail usam tel: e mailto: e nao abrem nova aba", () => {
    const anchors = elementsOf(renderContact(CONTACT, []), "a");
    const phone = anchors.find((anchor) => anchor["data-track"] === "phone");
    const email = anchors.find((anchor) => anchor["data-track"] === "email");
    assert.equal(phone?.href, "tel:(62)30000000".replace(/[()]/g, ""));
    assert.equal(email?.href, "mailto:contato@igreja.example.test");
    assert.equal(phone?.target, undefined);
    assert.equal(email?.target, undefined);
  });

  test("so os canais que existem viram cartao", () => {
    const only = buildCommunityContact({ email: "a@b.example.test" });
    assert.equal(elementsOf(renderContact(only, []), "a").length, 1);
  });

  test("titulo da secao e ancora #contato", () => {
    const html = renderContact(CONTACT, []);
    assert.deepEqual(textsOf(html, "h2"), ["Contato"]);
    assert.ok(html.includes('id="contato"'));
  });

  test("sem nenhum canal renderiza string vazia", () => {
    assert.equal(renderContact(NO_CONTACT, []), "");
  });
});

describe("ChurchProfileAttributes (Instalacoes e acessibilidade)", () => {
  test("agrupa por tema, so com os grupos que tem itens", () => {
    const html = renderAttributes(["Rampa na entrada", "Fraldario", "Bebedouro", "Libras"]);
    assert.deepEqual(textsOf(html, "h3"), ["Acessibilidade", "Crianças", "Estrutura"]);
    assert.equal(elementsOf(html, "li").length, 4);
  });

  test("so um grupo: so um cartao", () => {
    const html = renderAttributes(["Bebedouro", "Salao climatizado"]);
    assert.deepEqual(textsOf(html, "h3"), ["Estrutura"]);
  });

  test("titulo da secao e ancora #instalacoes, sem selo Campos novos", () => {
    const html = renderAttributes(["Bebedouro"]);
    assert.deepEqual(textsOf(html, "h2"), ["Instalações e acessibilidade"]);
    assert.ok(html.includes('id="instalacoes"'));
    assert.equal(html.toLowerCase().includes("campos novos"), false);
  });

  test("lista vazia (ou so espacos) renderiza string vazia", () => {
    assert.equal(renderAttributes([]), "");
    assert.equal(renderAttributes(["  "]), "");
  });
});

describe("escape do nome da comunidade", () => {
  test("nome com script sai escapado no aria-label dos links", () => {
    const hostile = "<script>alert(1)</script>";
    const html = renderContact(CONTACT, LINKS, hostile);

    assert.equal(html.includes("<script>"), false);
    assert.equal(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), true);
  });
});
