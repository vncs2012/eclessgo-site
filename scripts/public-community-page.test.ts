import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { mapPublicChurchDetails, mapPublicChurchListItem, normalizeDurationMinutes } from "../src/lib/public-church-utils.ts";
import {
  availableSections,
  buildCommunityAddress,
  buildCommunityContact,
  durationMessage,
  formatUpdatedDate,
  googleMapsUrl,
  groupFeatures,
  groupScheduleRows,
  formatShortDate,
  initials,
  messageAction,
  networkDisplay,
  normalizeScheduleRows,
  safeHttpsUrl,
  whatsappDigits,
  wazeUrl,
  SECTION_IDS,
} from "../src/lib/public-community-page.ts";

/* Regras puras da pagina da Comunidade (Modelo 8). */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("normalizeScheduleRows", () => {
  test("ordena de domingo a sabado e depois por hora; aceita dia em minusculas", () => {
    const rows = normalizeScheduleRows([
      { title: "Oracao", day: "wednesday", time: "19:30" },
      { title: "Celebracao", day: "SUNDAY", time: "18:00" },
      { title: "Celebracao", day: "SUNDAY", time: "09:00", description: " Cerca de 1h30 " },
    ]);
    assert.deepEqual(
      rows.map((row) => `${row.day} ${row.time}`),
      ["SUNDAY 09:00", "SUNDAY 18:00", "WEDNESDAY 19:30"],
    );
    assert.equal(rows[0].description, "Cerca de 1h30");
  });

  test("texto solto (legado) vira linha so com titulo; lixo e descartado", () => {
    const rows = normalizeScheduleRows(["Culto de domingo", 5, null, {}, { day: "", time: "" }]);
    assert.deepEqual(
      rows.map((row) => row.title),
      ["Culto de domingo"],
    );
  });

  test("nao e lista: vazio", () => {
    assert.deepEqual(normalizeScheduleRows(undefined), []);
    assert.deepEqual(normalizeScheduleRows({}), []);
  });
});

describe("groupScheduleRows", () => {
  const rows = normalizeScheduleRows([
    { title: "Celebração", day: "SUNDAY", time: "18:00" },
    { title: "Celebração", day: "SUNDAY", time: "09:00", description: "Cerca de 1h30" },
    { title: "Celebração", day: "SUNDAY", time: "09:00" },
    { title: "Grupos nas casas", day: "TUESDAY", time: "20:00", description: "Combinado pelo WhatsApp" },
    { title: "Escola bíblica", day: "SUNDAY", time: "10:30" },
  ]);

  test("mesmo dia e título viram uma linha com as horas em ordem, sem repetir", () => {
    const groups = groupScheduleRows(rows);
    assert.deepEqual(
      groups.map((group) => [group.day, group.title, group.times]),
      [
        ["SUNDAY", "Celebração", ["09:00", "18:00"]],
        ["SUNDAY", "Escola bíblica", ["10:30"]],
        ["TUESDAY", "Grupos nas casas", ["20:00"]],
      ],
    );
  });

  test("usa a descrição do primeiro item que tiver uma", () => {
    assert.equal(groupScheduleRows(rows)[0].description, "Cerca de 1h30");
    assert.equal(groupScheduleRows(rows)[2].description, "Combinado pelo WhatsApp");
  });

  test("dias diferentes com o mesmo título nao se juntam; sem linhas, sem grupos", () => {
    const apart = normalizeScheduleRows([
      { title: "Culto", day: "SUNDAY", time: "09:00" },
      { title: "Culto", day: "WEDNESDAY", time: "09:00" },
    ]);
    assert.equal(groupScheduleRows(apart).length, 2);
    assert.deepEqual(groupScheduleRows([]), []);
  });

  test("data curta do celular: dd/mm", () => {
    assert.equal(formatShortDate("2026-11-03T12:00:00Z", "pt-BR"), "03/11");
  });
});

describe("contatos", () => {
  test("WhatsApp brasileiro com 10/11 digitos ganha DDI 55; invalido some", () => {
    assert.equal(whatsappDigits("(62) 90000-0000"), "5562900000000");
    assert.equal(whatsappDigits("+55 62 3000-0000"), "556230000000");
    assert.equal(whatsappDigits("123"), null);
  });

  test("so existe canal que veio na API; telefone nao vira WhatsApp", () => {
    const contact = buildCommunityContact({ phone: "(62) 3000-0000" });
    assert.equal(contact.whatsapp, null);
    assert.equal(contact.phone?.href, "tel:6230000000");
    assert.equal(messageAction(contact)?.kind, "phone");
  });

  test("Mandar mensagem prefere WhatsApp, depois e-mail, depois telefone", () => {
    const all = buildCommunityContact({ whatsapp: "62900000000", email: "a@b.example", phone: "6230000000" });
    assert.equal(messageAction(all)?.kind, "whatsapp");
    assert.equal(messageAction(buildCommunityContact({ email: "a@b.example" }))?.href, "mailto:a@b.example");
    assert.equal(messageAction(buildCommunityContact({})), null);
    assert.equal(messageAction(buildCommunityContact(null)), null);
  });

  test("redes: @perfil do Instagram e dominio sem www", () => {
    assert.equal(networkDisplay("instagram", "https://instagram.com/aurora.exemplo/"), "@aurora.exemplo");
    assert.equal(networkDisplay("website", "https://www.aurora.exemplo.org/"), "aurora.exemplo.org");
  });

  test("safeHttpsUrl so aceita https sem credenciais", () => {
    assert.equal(safeHttpsUrl("https://youtube.com/live/x"), "https://youtube.com/live/x");
    assert.equal(safeHttpsUrl("http://youtube.com/x"), null);
    assert.equal(safeHttpsUrl("javascript:alert(1)"), null);
    assert.equal(safeHttpsUrl("https://user:pw@evil.example/"), null);
    assert.equal(safeHttpsUrl(undefined), null);
  });
});

describe("endereco e rotas", () => {
  const input = {
    addressLine: "Rua Exemplo, 123, Setor Bueno, Goiânia, GO",
    address: { street: "Rua Exemplo", number: "123", zip: "74000-000" },
    neighborhood: "Setor Bueno",
    city: "Goiânia",
    state: "GO",
  };

  test("separa rua, bairro e cidade sem repetir", () => {
    const address = buildCommunityAddress(input);
    assert.equal(address.street, "Rua Exemplo, 123");
    assert.equal(address.locality, "Setor Bueno, Goiânia");
    assert.equal(address.lineOne, "Rua Exemplo, 123 · Setor Bueno");
    assert.equal(address.lineTwo, "Goiânia · GO · 74000-000");
  });

  test("endereco so em texto corrido nao repete bairro e cidade", () => {
    const address = buildCommunityAddress({ ...input, address: {} });
    assert.equal(address.street, input.addressLine);
    assert.equal(address.locality, null);
  });

  test("'Endereço não informado' nao conta como endereco", () => {
    const address = buildCommunityAddress({
      addressLine: "Endereço não informado",
      address: {},
      neighborhood: null,
      city: null,
      state: null,
    });
    assert.equal(address.hasAddress, false);
    assert.equal(googleMapsUrl({ location: null, addressLine: "Endereço não informado" }), null);
    assert.equal(wazeUrl({ location: null, addressLine: "Endereço não informado" }), null);
  });

  test("Google Maps e Waze usam as coordenadas, com o texto como reserva", () => {
    const location = { lat: -16.6869, lng: -49.2648 };
    assert.equal(
      googleMapsUrl({ location, addressLine: "x" }),
      "https://www.google.com/maps/dir/?api=1&destination=-16.6869,-49.2648",
    );
    assert.equal(wazeUrl({ location, addressLine: "x" }), "https://waze.com/ul?ll=-16.6869,-49.2648&navigate=yes");
    assert.equal(
      googleMapsUrl({ location: null, addressLine: "Rua A, 1" }),
      "https://www.google.com/maps/dir/?api=1&destination=Rua%20A%2C%201",
    );
  });
});

describe("instalacoes", () => {
  test("agrupa por palavra-chave; Bebedouro nao e 'crianca' e Auditorio nao e acessibilidade", () => {
    const groups = groupFeatures(["Rampa na entrada", "Fraldário", "Bebedouro", "Auditório", "Espaço infantil"]);
    assert.deepEqual(
      groups.map((group) => [group.key, group.items]),
      [
        ["accessibility", ["Rampa na entrada"]],
        ["children", ["Fraldário", "Espaço infantil"]],
        ["structure", ["Bebedouro", "Auditório"]],
      ],
    );
  });

  test("sem itens: nenhum grupo", () => {
    assert.deepEqual(groupFeatures([]), []);
  });

  test("código vai para o grupo do vocabulário, traduzido; palavra-chave só para texto livre", () => {
    const labels = JSON.parse(readFileSync(resolve(ROOT, "src/messages/pt-BR.json"), "utf8")).features
      .codes as Record<string, string>;
    const groups = groupFeatures(
      ["Bebedouro", "PARKING", "Fraldário", "LIBRAS", "NURSERY", "Rampa lateral", "ELEVATOR", "TOALHAS NO BANHEIRO"],
      labels,
    );
    assert.deepEqual(
      groups.map((group) => [group.key, group.items]),
      [
        ["accessibility", ["Elevador", "Libras", "Rampa lateral"]],
        ["children", ["Berçário", "Fraldário"]],
        ["structure", ["Estacionamento", "Bebedouro", "TOALHAS NO BANHEIRO"]],
      ],
    );
  });
});

describe("secoes e apresentacao", () => {
  test("availableSections mantem a ordem do Modelo 8 e so deixa as que tem dado", () => {
    const none = Object.fromEntries(SECTION_IDS.map((id) => [id, false])) as Record<(typeof SECTION_IDS)[number], boolean>;
    assert.deepEqual(availableSections(none), []);
    assert.deepEqual(availableSections({ ...none, perto: true, sobre: true, contato: true }), ["sobre", "contato", "perto"]);
  });

  test("data de atualizacao dd/mm/aaaa em Sao Paulo", () => {
    assert.equal(formatUpdatedDate("2026-11-03T12:00:00Z", "pt-BR"), "03/11/2026");
  });

  test("iniciais", () => {
    assert.equal(initials("Ana Souza Lima"), "AL");
    assert.equal(initials("Marcos"), "MA");
  });
});

describe("mapeamento do detalhe", () => {
  const base = { id: "1", slug: "a", name: "A" };

  test("sem live_url/updated_at as chaves ficam fora do objeto", () => {
    const details = mapPublicChurchDetails(base);
    assert.equal("liveUrl" in details, false);
    assert.equal("updatedAt" in details, false);
  });

  test("com live_url e updated_at validos eles entram", () => {
    const details = mapPublicChurchDetails({
      ...base,
      live_url: "https://youtube.com/live/x",
      updated_at: "2026-11-03T12:00:00Z",
    } as Parameters<typeof mapPublicChurchDetails>[0]);
    assert.equal(details.liveUrl, "https://youtube.com/live/x");
    assert.equal(details.updatedAt, "2026-11-03T12:00:00Z");
  });

  test("updated_at invalido e ignorado", () => {
    const details = mapPublicChurchDetails({ ...base, updated_at: "ontem" } as Parameters<typeof mapPublicChurchDetails>[0]);
    assert.equal("updatedAt" in details, false);
  });
});

describe("como chegar e quem e quem no detalhe", () => {
  const base = { id: "1", slug: "a", name: "A" };
  const map = (extra: Record<string, unknown>) =>
    mapPublicChurchDetails({ ...base, ...extra } as Parameters<typeof mapPublicChurchDetails>[0]);

  test("sem directions/public_team as chaves ficam fora do objeto", () => {
    for (const extra of [{}, { directions: null, public_team: [] }, { directions: {}, public_team: null }]) {
      const details = map(extra);
      assert.equal("directions" in details, false);
      assert.equal("publicTeam" in details, false);
    }
  });

  test("directions: so as orientacoes com texto, aparadas", () => {
    assert.deepEqual(map({ directions: { entrance: " Porta lateral ", bus: "  ", parking: null } }).directions, {
      entrance: "Porta lateral",
    });
    assert.deepEqual(map({ directions: { entrance: "A", bus: "B", parking: "C" } }).directions, {
      entrance: "A",
      bus: "B",
      parking: "C",
    });
  });

  test("public_team: nome obrigatorio, funcao opcional, lixo descartado", () => {
    assert.deepEqual(
      map({ public_team: [{ name: " Marcos ", role: "Responsável" }, { name: "Ana" }, { name: " " }, null, "x", { role: "sem nome" }] })
        .publicTeam,
      [
        { name: "Marcos", role: "Responsável" },
        { name: "Ana", role: null },
      ],
    );
  });
});

describe("duracao dos horarios", () => {
  test("normalizeDurationMinutes: inteiro de 1 a 1440; o resto e nulo", () => {
    assert.equal(normalizeDurationMinutes(90), 90);
    assert.equal(normalizeDurationMinutes("45"), 45);
    for (const value of [0, -5, 1441, 1.5, "abc", "", null, undefined, NaN, {}]) {
      assert.equal(normalizeDurationMinutes(value), null, String(value));
    }
  });

  test("durationMessage: minutos, horas cheias e horas com minutos", () => {
    assert.deepEqual(durationMessage(45), { key: "durationMinutes", values: { minutes: 45 } });
    assert.deepEqual(durationMessage(60), { key: "durationHours", values: { hours: 1 } });
    assert.deepEqual(durationMessage(90), { key: "durationBoth", values: { hours: 1, minutes: "30" } });
    assert.deepEqual(durationMessage(125), { key: "durationBoth", values: { hours: 2, minutes: "05" } });
    assert.deepEqual(durationMessage(120), { key: "durationHours", values: { hours: 2 } });
    assert.equal(durationMessage(null), null);
    assert.equal(durationMessage(0), null);
  });

  test("os textos pt-BR e en formam 'Cerca de 1h30' / 'About 1h 30min'", () => {
    const load = (locale: string) =>
      (JSON.parse(readFileSync(resolve(ROOT, `src/messages/${locale}.json`), "utf8")) as {
        communityPage: { schedule: Record<string, string> };
      }).communityPage.schedule;
    const fill = (template: string, values: Record<string, string | number>) =>
      template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key]));
    const pt = load("pt-BR");
    const en = load("en");
    assert.equal(fill(pt.durationMinutes, { minutes: 45 }), "Cerca de 45 min");
    assert.equal(fill(pt.durationHours, { hours: 1 }), "Cerca de 1h");
    assert.equal(fill(pt.durationBoth, { hours: 1, minutes: "30" }), "Cerca de 1h30");
    assert.equal(fill(en.durationMinutes, { minutes: 45 }), "About 45 min");
    assert.equal(fill(en.durationHours, { hours: 1 }), "About 1h");
    assert.equal(fill(en.durationBoth, { hours: 1, minutes: "30" }), "About 1h 30min");
  });

  test("detalhe: normalizeScheduleRows le duration_minutes; invalido vira nulo", () => {
    const rows = normalizeScheduleRows([
      { title: "A", day: "SUNDAY", time: "09:00", duration_minutes: 90 },
      { title: "B", day: "MONDAY", time: "09:00", duration_minutes: null },
      { title: "C", day: "TUESDAY", time: "09:00", duration_minutes: 99999 },
      { title: "D", day: "WEDNESDAY", time: "09:00" },
      "texto solto",
    ]);
    assert.deepEqual(rows.map((row) => row.durationMinutes), [90, null, null, null, null]);
  });

  test("horas do mesmo dia e titulo so se juntam com a mesma duracao", () => {
    const groups = groupScheduleRows(
      normalizeScheduleRows([
        { title: "Celebração", day: "SUNDAY", time: "09:00", duration_minutes: 90 },
        { title: "Celebração", day: "SUNDAY", time: "11:00", duration_minutes: 90 },
        { title: "Celebração", day: "SUNDAY", time: "18:00" },
      ]),
    );
    assert.deepEqual(
      groups.map((group) => [group.times, group.durationMinutes]),
      [
        [["09:00", "11:00"], 90],
        [["18:00"], null],
      ],
    );
  });

  test("lista: durationMinutes entra no horario so quando valido", () => {
    const item = mapPublicChurchListItem({
      id: "1",
      slug: "a",
      name: "A",
      location: { lat: 1, lng: 1 },
      schedule: [
        { day: "SUNDAY", time: "09:00", title: "Culto", duration_minutes: 90 },
        { day: "MONDAY", time: "20:00", title: "Oração", duration_minutes: null },
        { day: "TUESDAY", time: "20:00", title: "Grupo", duration_minutes: 0 },
      ],
    } as never);
    assert.equal(item?.schedule?.[0].durationMinutes, 90);
    assert.equal("durationMinutes" in (item?.schedule?.[1] ?? {}), false);
    assert.equal("durationMinutes" in (item?.schedule?.[2] ?? {}), false);
  });
});

describe("mensagens communityPage", () => {
  type Tree = { [key: string]: string | Tree };
  const load = (locale: string) =>
    (JSON.parse(readFileSync(resolve(ROOT, `src/messages/${locale}.json`), "utf8")) as { communityPage: Tree }).communityPage;
  const keys = (node: Tree, prefix = ""): string[] =>
    Object.entries(node).flatMap(([key, value]) =>
      typeof value === "string" ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`),
    );

  test("pt-BR e en tem as mesmas chaves, todas com texto", () => {
    assert.deepEqual(keys(load("pt-BR")).sort(), keys(load("en")).sort());
    const walk = (node: Tree): void => {
      for (const value of Object.values(node)) {
        if (typeof value === "string") assert.notEqual(value.trim(), "");
        else walk(value);
      }
    };
    walk(load("pt-BR"));
    walk(load("en"));
  });

  test("ha um rotulo de menu para cada secao", () => {
    const nav = load("pt-BR").nav as Tree;
    for (const id of SECTION_IDS) assert.equal(typeof nav[id], "string", `nav.${id}`);
  });
});
