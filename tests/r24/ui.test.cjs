const assert = require("node:assert/strict");
const { after, afterEach, test } = require("node:test");

const { JSDOM } = require("/home/vncs/Documentos/Particular/comunidade/eclessGO/eclessgo-painel/node_modules/jsdom");

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(global, "navigator", { configurable: true, value: dom.window.navigator });

const React = require("react");
const { createRoot } = require("react-dom/client");
const act = React.act || require("react-dom/test-utils").act;
const ts = require("typescript");
const {
  loadR24Component,
  loadR24Messages,
  readR24AliasPageSource,
  readR24PageSource,
} = require("./harness.cjs");

const SOURCE_ROOT = process.env.R24_SOURCE_ROOT;
const SLUG = "comunidade-do-norte";
const TRANSLATION_KEYS = [
  "title",
  "description",
  "availability",
  "questionLabel",
  "questionPlaceholder",
  "characterCount",
  "privacyNotice",
  "submit",
  "pending",
  "conversationLabel",
  "you",
  "answerHeading",
  "sourceLink",
  "noInformation",
  "notConfigured",
  "unavailable",
  "invalidResponse",
];

const messages = loadR24Messages({ root: SOURCE_ROOT });
const activeViews = new Set();

afterEach(async () => {
  for (const view of [...activeViews]) await view.destroy();
});

after(() => dom.window.close());

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function httpResponse(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() {
      return payload;
    },
  };
}

function createView({ slug = SLUG, locale = "pt-BR", fetchImpl } = {}) {
  const localeState = { current: locale };
  const calls = [];
  const fetchStub = fetchImpl || ((url, options) => {
    const pending = deferred();
    calls.push({ url, options, pending });
    return pending.promise;
  });
  const nextIntl = {
    useLocale() {
      return localeState.current;
    },
    useTranslations(namespace) {
      return (key, values = {}) => {
        const value = messages[localeState.current]?.[namespace]?.[key];
        if (typeof value !== "string") throw new Error(`Missing synthetic translation: ${namespace}.${key}`);
        return value.replace(/\{([^}]+)\}/g, (_match, name) => String(values[name] ?? `{${name}}`));
      };
    },
  };
  const { PublicInformationAssistant } = loadR24Component({
    root: SOURCE_ROOT,
    nextIntl,
    fetch: fetchStub,
  });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  let isDestroyed = false;

  async function render(nextSlug = slug) {
    slug = nextSlug;
    await act(async () => {
      root.render(React.createElement(PublicInformationAssistant, { slug }));
    });
  }

  async function setLocale(nextLocale) {
    localeState.current = nextLocale;
    await render(slug);
  }

  async function enterQuestion(value) {
    const textarea = container.querySelector("textarea");
    assert.ok(textarea);
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set.call(textarea, value);
      textarea.dispatchEvent(new window.Event("input", { bubbles: true }));
    });
  }

  async function submit() {
    const form = container.querySelector("form");
    assert.ok(form);
    await act(async () => {
      form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    });
  }

  async function resolveCall(index, status, payload) {
    const call = calls[index];
    assert.ok(call);
    await act(async () => {
      call.pending.resolve(httpResponse(status, payload));
      await call.pending.promise;
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  async function destroy() {
    if (isDestroyed) return;
    isDestroyed = true;
    await act(async () => root.unmount());
    container.remove();
    activeViews.delete(view);
  }

  const view = {
    container,
    calls,
    get locale() { return localeState.current; },
    render,
    setLocale,
    enterQuestion,
    submit,
    resolveCall,
    destroy,
  };
  activeViews.add(view);
  return view;
}

function answered(slug = SLUG, answer = "Informação publicada") {
  return {
    slug,
    status: "answered",
    answer: [answer],
    sources: [{ factId: "description", href: `/comunidades/${slug}` }],
  };
}

async function ask(view, question, payload = answered(), status = 200) {
  await view.enterQuestion(question);
  await view.submit();
  assert.equal(view.calls.length > 0, true);
  await view.resolveCall(view.calls.length - 1, status, payload);
}

test("both message namespaces contain the complete public assistant contract", () => {
  for (const locale of ["pt-BR", "en"]) {
    const namespace = messages[locale]?.publicAssistant;
    assert.ok(namespace);
    assert.deepEqual(Object.keys(namespace).sort(), [...TRANSLATION_KEYS].sort());
    assert.equal(Object.values(namespace).every((value) => typeof value === "string" && value.length > 0), true);
  }
});

test("initial form is accessible, translated, and does not fetch automatically", async () => {
  for (const locale of ["pt-BR", "en"]) {
    const view = createView({ locale });
    await view.render();

    const textarea = view.container.querySelector("textarea");
    const label = view.container.querySelector(`label[for="${textarea.id}"]`);
    assert.ok(label);
    assert.equal(label.textContent, messages[locale].publicAssistant.questionLabel);
    assert.equal(textarea.placeholder, messages[locale].publicAssistant.questionPlaceholder);
    const describedBy = textarea.getAttribute("aria-describedby").split(/\s+/);
    assert.equal(describedBy.every((id) => view.container.querySelector(`#${id}`)), true);
    assert.equal(view.container.textContent.includes(messages[locale].publicAssistant.privacyNotice), true);
    assert.match(view.container.textContent, /500/);
    assert.equal(view.container.textContent.includes(messages[locale].publicAssistant.availability), true);
    assert.equal(view.container.querySelector("form").getAttribute("aria-busy"), "false");
    assert.equal(view.container.querySelector('button[type="submit"]').disabled, true);
    assert.equal(view.container.querySelector("ol"), null);
    assert.equal(view.calls.length, 0);
  }
});

test("question limit counts Unicode code points and accepts exactly 500", async () => {
  const view = createView();
  await view.render();

  await view.enterQuestion("😀".repeat(500));
  assert.equal(view.container.querySelector('button[type="submit"]').disabled, false);
  assert.match(view.container.textContent, /500 de 500/);

  await view.enterQuestion("😀".repeat(501));
  assert.equal(view.container.querySelector('button[type="submit"]').disabled, true);
  assert.match(view.container.textContent, /501 de 500/);
  assert.equal(view.calls.length, 0);
});

test("pending state blocks duplicate synchronous submits and sends only question and locale", async () => {
  const view = createView();
  await view.render();
  await view.enterQuestion("Onde fica?");

  const form = view.container.querySelector("form");
  await act(async () => {
    form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  });

  assert.equal(view.calls.length, 1);
  assert.equal(view.container.querySelector('button[type="submit"]').disabled, true);
  assert.equal(view.container.querySelector('[role="status"]')?.textContent, messages["pt-BR"].publicAssistant.pending);
  const [call] = view.calls;
  assert.equal(call.url, `/api/public/churches/slug/${SLUG}/assistant`);
  assert.equal(call.options.method, "POST");
  assert.equal(call.options.credentials, "omit");
  assert.equal(call.options.cache, "no-store");
  assert.deepEqual(Object.keys(call.options.headers), ["Content-Type"]);
  assert.deepEqual(Object.keys(JSON.parse(call.options.body)).sort(), ["locale", "question"]);
  assert.deepEqual(JSON.parse(call.options.body), { question: "Onde fica?", locale: "pt-BR" });
  assert.equal(call.options.signal instanceof AbortSignal, true);

  await view.resolveCall(0, 200, answered());
});

test("answered content is rendered as text with only the canonical same-community citation", async () => {
  const view = createView();
  await view.render();
  const untrustedText = '<strong data-marker="injected">Informação</strong>';
  await ask(view, "O que foi publicado?", answered(SLUG, untrustedText));

  assert.equal(view.container.querySelector("strong[data-marker='injected']"), null);
  assert.equal(view.container.textContent.includes(untrustedText), true);
  const link = view.container.querySelector("a");
  assert.ok(link);
  assert.equal(link.getAttribute("href"), `/comunidades/${SLUG}`);
  assert.equal(link.textContent, messages["pt-BR"].publicAssistant.sourceLink);
});

test("no_information is distinct and contains no citation", async () => {
  const view = createView();
  await view.render();
  await ask(view, "Há estacionamento?", {
    slug: SLUG,
    status: "no_information",
    answer: [],
    sources: [],
  });

  assert.match(view.container.textContent, /Não encontrei informação publicada/);
  assert.equal(view.container.querySelector("a"), null);
});

test("no-information and failure states use the selected English translations", async () => {
  const view = createView({ locale: "en" });
  await view.render();
  await ask(view, "Is there parking?", {
    slug: SLUG,
    status: "no_information",
    answer: [],
    sources: [],
  });
  assert.equal(view.container.textContent.includes(messages.en.publicAssistant.noInformation), true);

  await view.enterQuestion("Where is the community?");
  await view.submit();
  await view.resolveCall(1, 503, { code: "ASSISTANT_NOT_CONFIGURED" });
  assert.equal(view.container.textContent.includes(messages.en.publicAssistant.notConfigured), true);

  await view.submit();
  await view.resolveCall(2, 503, { code: "ASSISTANT_UNAVAILABLE" });
  assert.equal(view.container.textContent.includes(messages.en.publicAssistant.unavailable), true);
});

test("configuration and service failures have separate translated messages and can be retried", async () => {
  const view = createView();
  await view.render();

  await view.enterQuestion("Onde fica?");
  await view.submit();
  await view.resolveCall(0, 503, { code: "ASSISTANT_NOT_CONFIGURED" });
  assert.match(view.container.textContent, /O assistente ainda não pode responder/);
  assert.doesNotMatch(view.container.textContent, /adaptador|provedor|configuração/i);

  await view.submit();
  assert.equal(view.calls.length, 2);
  assert.equal(view.container.querySelector('[role="alert"]'), null);
  await view.resolveCall(1, 503, { code: "ASSISTANT_UNAVAILABLE" });
  assert.match(view.container.textContent, /Não foi possível responder agora/);

  await view.submit();
  assert.equal(view.calls.length, 3);
  await view.resolveCall(2, 200, answered());
  assert.ok(view.container.querySelector("ol"));
});

test("malformed result shapes, mismatched slug, and noncanonical citations are rejected", async () => {
  const invalidPayloads = [
    { ...answered(), extra: true },
    answered("outra-comunidade"),
    { ...answered(), sources: [{ factId: "description", href: "https://example.invalid/" }] },
    { ...answered(), sources: [{ factId: "description", href: `/comunidades/${SLUG}`, extra: true }] },
    { ...answered(), sources: [{ factId: "description", href: `/comunidades/outra-comunidade` }] },
    { ...answered(), sources: [{ factId: "description", href: `/igrejas/${SLUG}` }] },
    { ...answered(), sources: [] },
    { ...answered(), answer: ["Primeira", "Segunda"], sources: [
      { factId: "description", href: `/comunidades/${SLUG}` },
      { factId: "description", href: `/comunidades/${SLUG}` },
    ] },
    { slug: SLUG, status: "no_information", answer: ["conteúdo inesperado"], sources: [] },
  ];

  for (const payload of invalidPayloads) {
    const view = createView();
    await view.render();
    await ask(view, "Pergunta de teste", payload);

    assert.equal(view.container.querySelector("ol"), null);
    assert.equal(view.container.querySelector("a"), null);
    assert.match(view.container.textContent, /Não foi possível validar esta resposta/);
  }
});

test("only HTTP 200 can carry an answered result", async () => {
  const view = createView();
  await view.render();
  await ask(view, "Pergunta?", answered(), 201);

  assert.equal(view.container.querySelector("ol"), null);
  assert.match(view.container.textContent, /Não foi possível validar esta resposta/);
});

test("network failures stay generic and allow retry", async () => {
  const view = createView();
  await view.render();
  await view.enterQuestion("Qual é o endereço?");
  await view.submit();

  await act(async () => {
    view.calls[0].pending.reject(new Error("private network detail"));
    await view.calls[0].pending.promise.catch(() => undefined);
    await Promise.resolve();
    await Promise.resolve();
  });

  assert.match(view.container.textContent, /Não foi possível responder agora/);
  assert.doesNotMatch(view.container.textContent, /private network detail/);
  await view.submit();
  assert.equal(view.calls.length, 2);
  await view.resolveCall(1, 200, answered());
  assert.ok(view.container.querySelector("ol"));
});

test("changing slug aborts pending work, clears the conversation, and discards late results", async () => {
  const view = createView();
  await view.render();
  await ask(view, "Uma resposta anterior?");
  await view.enterQuestion("Pergunta pendente?");
  await view.submit();
  const staleCall = view.calls[1];

  await view.render("outra-comunidade");
  assert.equal(staleCall.options.signal.aborted, true);
  assert.equal(view.container.querySelector("textarea").value, "");
  assert.equal(view.container.querySelector("ol"), null);
  assert.equal(view.container.querySelector('[role="status"]'), null);

  await view.resolveCall(1, 200, answered(SLUG, "Resposta antiga"));
  assert.equal(view.container.textContent.includes("Resposta antiga"), false);
  await view.enterQuestion("Onde fica a nova comunidade?");
  await view.submit();
  assert.equal(view.calls[2].url, "/api/public/churches/slug/outra-comunidade/assistant");
  await view.resolveCall(2, 200, answered("outra-comunidade", "Resposta atual"));
  assert.equal(view.container.textContent.includes("Resposta atual"), true);
  assert.equal(view.container.querySelector("a").getAttribute("href"), "/comunidades/outra-comunidade");
});

test("changing locale aborts pending work, clears prior turns, and uses the new locale", async () => {
  const view = createView({ locale: "pt-BR" });
  await view.render();
  await ask(view, "Pergunta anterior?");
  await view.enterQuestion("Pergunta pendente?");
  await view.submit();
  const staleCall = view.calls[1];

  await view.setLocale("en");
  assert.equal(staleCall.options.signal.aborted, true);
  assert.equal(view.container.querySelector("textarea").value, "");
  assert.equal(view.container.querySelector("ol"), null);
  assert.equal(view.container.querySelector('[role="status"]'), null);
  assert.equal(view.container.querySelector("label").textContent, messages.en.publicAssistant.questionLabel);

  await view.resolveCall(1, 200, answered(SLUG, "Stale result"));
  assert.equal(view.container.textContent.includes("Stale result"), false);
  await view.enterQuestion("Where is the community?");
  await view.submit();
  assert.deepEqual(JSON.parse(view.calls[2].options.body), {
    question: "Where is the community?",
    locale: "en",
  });
  await view.resolveCall(2, 200, answered(SLUG, "Current result"));
  assert.equal(view.container.textContent.includes("Current result"), true);
});

test("unmount aborts the active request", async () => {
  const view = createView();
  await view.render();
  await view.enterQuestion("Pergunta pendente?");
  await view.submit();
  const signal = view.calls[0].options.signal;

  await view.destroy();
  assert.equal(signal.aborted, true);
});

test("only the latest ten completed question and answer pairs remain in memory", async () => {
  const view = createView();
  await view.render();

  for (let index = 1; index <= 11; index += 1) {
    await ask(view, `Pergunta ${index}?`, answered(SLUG, `Resposta ${index}`));
  }

  const turns = view.container.querySelectorAll("ol > li");
  assert.equal(turns.length, 10);
  const questions = [...view.container.querySelectorAll("ol > li > p")].map((paragraph) => paragraph.textContent);
  const answers = [...view.container.querySelectorAll("ol > li > div > ul > li > p.whitespace-pre-wrap")]
    .map((paragraph) => paragraph.textContent);
  assert.equal(questions.some((question) => question.endsWith("Pergunta 1?")), false);
  assert.equal(answers.includes("Resposta 1"), false);
  assert.equal(questions.some((question) => question.endsWith("Pergunta 2?")), true);
  assert.equal(answers.includes("Resposta 11"), true);
  assert.equal(view.calls.length, 11);
  for (const call of view.calls) {
    assert.deepEqual(Object.keys(JSON.parse(call.options.body)).sort(), ["locale", "question"]);
  }
});

test("canonical community page renders the assistant and the alias delegates to that page", () => {
  const pageSource = readR24PageSource({ root: SOURCE_ROOT });
  const aliasSource = readR24AliasPageSource({ root: SOURCE_ROOT });
  const pageAst = ts.createSourceFile("canonical-page.tsx", pageSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const aliasAst = ts.createSourceFile("alias-page.tsx", aliasSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const assistantImportExists = pageAst.statements.some((statement) => {
    if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== "@/components/site/public-information-assistant") {
      return false;
    }
    const namedBindings = statement.importClause?.namedBindings;
    return Boolean(namedBindings) && ts.isNamedImports(namedBindings) &&
      namedBindings.elements.some((element) => element.name.text === "PublicInformationAssistant");
  });
  let assistantRenderExists = false;
  const visitPage = (node) => {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageAst) === "PublicInformationAssistant") {
      assistantRenderExists = node.attributes.properties.some((attribute) => {
        if (!ts.isJsxAttribute(attribute) || attribute.name.getText(pageAst) !== "slug") return false;
        const expression = attribute.initializer;
        if (!expression || !ts.isJsxExpression(expression) || !expression.expression) return false;
        return ts.isPropertyAccessExpression(expression.expression) &&
          expression.expression.expression.getText(pageAst) === "church" &&
          expression.expression.name.text === "slug";
      });
    }
    ts.forEachChild(node, visitPage);
  };
  visitPage(pageAst);

  const hasAssistantRender = (root, sourceFile) => {
    let found = false;
    const visit = (node) => {
      if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(sourceFile) === "PublicInformationAssistant") {
        found = node.attributes.properties.some((attribute) => {
          if (!ts.isJsxAttribute(attribute) || attribute.name.getText(sourceFile) !== "slug") return false;
          const expression = attribute.initializer;
          return Boolean(expression && ts.isJsxExpression(expression) && expression.expression &&
            ts.isPropertyAccessExpression(expression.expression) &&
            expression.expression.expression.getText(sourceFile) === "church" &&
            expression.expression.name.text === "slug");
        }) || found;
      }
      ts.forEachChild(node, visit);
    };
    visit(root);
    return found;
  };
  const detailPage = pageAst.statements.find((statement) =>
    ts.isFunctionDeclaration(statement) && statement.name?.text === "ChurchDetailPage",
  );
  const exportDefaultDetailPage = Boolean(
    detailPage?.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
    detailPage.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword),
  );
  const assistantInDetailPage = Boolean(
    detailPage && exportDefaultDetailPage && hasAssistantRender(detailPage, pageAst),
  );
  const unavailablePage = pageAst.statements.find((statement) =>
    ts.isFunctionDeclaration(statement) && statement.name?.text === "PublicChurchUnavailable",
  );
  const assistantInUnavailablePage = Boolean(unavailablePage && hasAssistantRender(unavailablePage, pageAst));

  const aliasImportExists = aliasAst.statements.some((statement) =>
    ts.isImportDeclaration(statement) &&
    statement.moduleSpecifier.text === "../../igrejas/[slug]/page" &&
    statement.importClause?.name?.text === "ChurchDetailPage",
  );
  let aliasDelegates = false;
  const visitAlias = (node) => {
    if (
      ts.isFunctionDeclaration(node) &&
      node.name?.text === "CommunityDetailPage" &&
      node.body?.statements.some((statement) => {
        if (!ts.isReturnStatement(statement) || !statement.expression || !ts.isJsxSelfClosingElement(statement.expression)) return false;
        return statement.expression.tagName.getText(aliasAst) === "ChurchDetailPage" &&
          statement.expression.attributes.properties.some((attribute) =>
            ts.isJsxSpreadAttribute(attribute) && attribute.expression.getText(aliasAst) === "props",
          );
      })
    ) aliasDelegates = true;
    ts.forEachChild(node, visitAlias);
  };
  visitAlias(aliasAst);

  assert.equal(assistantImportExists, true);
  assert.equal(assistantRenderExists, true);
  assert.equal(assistantInDetailPage, true);
  assert.equal(assistantInUnavailablePage, false);
  assert.equal(aliasImportExists, true);
  assert.equal(aliasDelegates, true);
});
