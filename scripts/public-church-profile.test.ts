import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildPublicChurchProfile,
  isAllowedMediaUrl,
  isValidNetworkUrl,
  NETWORK_KEYS,
  PUBLIC_FEATURES_MAX,
  PUBLIC_GALLERY_MAX,
} from "../src/lib/public-church-profile.ts";
import type { NetworkKey } from "../src/lib/public-church-profile.ts";

type ProfileInput = Parameters<typeof buildPublicChurchProfile>[0];

const MEDIA_ORIGIN = "https://media.example.test";

function build(overrides: Partial<ProfileInput> = {}) {
  return buildPublicChurchProfile({
    features: [],
    contact: {},
    thumbnail: null,
    photos: [],
    mediaOrigin: MEDIA_ORIGIN,
    ...overrides,
  });
}

test("limite de atributos publicos e 20", () => {
  assert.equal(PUBLIC_FEATURES_MAX, 20);
});

test("limite de galeria publica e 10", () => {
  assert.equal(PUBLIC_GALLERY_MAX, 10);
});

test("chaves de rede na ordem website, instagram, facebook, youtube", () => {
  assert.deepEqual([...NETWORK_KEYS], ["website", "instagram", "facebook", "youtube"]);
});

const features21 = Array.from({ length: 21 }, (_, index) => `Diferencial ${index + 1}`);

test("atributos: mantem 20 itens", () => {
  assert.equal(build({ features: features21 }).features.length, 20);
});

test("atributos: mantem o 20o item", () => {
  assert.equal(build({ features: features21 }).features.at(-1), "Diferencial 20");
});

test("atributos: corta o 21o item", () => {
  assert.equal(build({ features: features21 }).features.includes("Diferencial 21"), false);
});

for (const bad of [5, null, {}, "", "   "]) {
  test(`atributos: ignora item invalido ${JSON.stringify(bad)}`, () => {
    assert.deepEqual(build({ features: ["Cafe", bad, "Bercario"] }).features, ["Cafe", "Bercario"]);
  });
}

test("atributos: apara espacos das pontas e preserva a ordem", () => {
  assert.deepEqual(build({ features: ["  Estacionamento  ", " Bercario "] }).features, [
    "Estacionamento",
    "Bercario",
  ]);
});

test("atributos: features nao array devolve lista vazia", () => {
  assert.deepEqual(build({ features: "Estacionamento" }).features, []);
});

test("atributos: features null devolve lista vazia", () => {
  assert.deepEqual(build({ features: null }).features, []);
});

test("links: ordem fixa website, instagram, facebook, youtube", () => {
  assert.deepEqual(
    build({
      contact: {
        youtube: "https://youtube.com/igreja",
        facebook: "https://facebook.com/igreja",
        instagram: "https://instagram.com/igreja",
        website: "https://igreja.example.test",
      },
    }).links,
    [
      { key: "website", url: "https://igreja.example.test" },
      { key: "instagram", url: "https://instagram.com/igreja" },
      { key: "facebook", url: "https://facebook.com/igreja" },
      { key: "youtube", url: "https://youtube.com/igreja" },
    ],
  );
});

test("links: contato null devolve lista vazia", () => {
  assert.deepEqual(build({ contact: null }).links, []);
});

test("links: contato string devolve lista vazia", () => {
  assert.deepEqual(build({ contact: "https://instagram.com/x" }).links, []);
});

test("links: contato array devolve lista vazia", () => {
  assert.deepEqual(build({ contact: Object.assign([], { instagram: "https://instagram.com/x" }) }).links, []);
});

const ACCEPTED: Array<[NetworkKey, string]> = [
  ["instagram", "https://instagram.com/x"],
  ["instagram", "https://www.instagram.com/x"],
  ["instagram", "HTTPS://Instagram.com/x"],
  ["facebook", "https://facebook.com/igreja"],
  ["youtube", "https://youtu.be/abc"],
  ["youtube", "https://m.youtube.com/c"],
  ["website", "https://igreja.example.test"],
  ["website", "https://igreja.example.test.br"],
];

for (const [key, value] of ACCEPTED) {
  test(`aceita ${key}: ${value}`, () => {
    assert.equal(isValidNetworkUrl(key, value), true);
  });
}

const INSTAGRAM_REJECTED = [
  "http://instagram.com/x",
  "javascript:alert(1)",
  "//instagram.com/x",
  "https://u:p@instagram.com/x",
  "https://instagram.com:8443/x",
  "https://instagram.com/a b",
  "https://evil.dev\\.instagram.com/x",
  "https://instagram.com/a\\b",
  "https://evilinstagram.com/x",
  "https://instagram.com.evil.dev/x",
  " https://instagram.com/x",
];

for (const value of INSTAGRAM_REJECTED) {
  test(`rejeita instagram: ${JSON.stringify(value)}`, () => {
    assert.equal(isValidNetworkUrl("instagram", value), false);
  });
}

for (const value of [123, {}, null]) {
  test(`rejeita instagram com valor nao string: ${JSON.stringify(value)}`, () => {
    assert.equal(isValidNetworkUrl("instagram", value), false);
  });
}

const WRONG_HOST: Array<[NetworkKey, string]> = [
  ["facebook", "https://instagram.com/x"],
  ["facebook", "https://evilfacebook.com/x"],
  ["youtube", "https://instagram.com/x"],
  ["youtube", "https://evilyoutube.com/x"],
  ["youtube", "https://youtu.be.evil.dev/x"],
  ["youtube", "http://youtube.com/x"],
];

for (const [key, value] of WRONG_HOST) {
  test(`rejeita ${key} com host errado: ${value}`, () => {
    assert.equal(isValidNetworkUrl(key, value), false);
  });
}

const WEBSITE_REJECTED = [
  "https://localhost",
  "https://127.0.0.1",
  "https://127.1",
  "https://0x7f.0.0.1",
  "https://10.0.0.0x1",
  "https://semponto",
  "https://x_y.dev/a",
  "https://[::1]",
];

for (const value of WEBSITE_REJECTED) {
  test(`rejeita website: ${value}`, () => {
    assert.equal(isValidNetworkUrl("website", value), false);
  });
}

test("rede: URL de instagram com 500 caracteres e aceita", () => {
  assert.equal(isValidNetworkUrl("instagram", "https://instagram.com/" + "a".repeat(478)), true);
});

test("rede: URL de instagram com 501 caracteres e rejeitada", () => {
  assert.equal(isValidNetworkUrl("instagram", "https://instagram.com/" + "a".repeat(479)), false);
});

test("rede: URL de instagram com 500 code points fora do BMP e aceita", () => {
  assert.equal(isValidNetworkUrl("instagram", "https://instagram.com/" + "😀".repeat(478)), true);
});

test("rede: URL de instagram com 501 code points fora do BMP e rejeitada", () => {
  assert.equal(isValidNetworkUrl("instagram", "https://instagram.com/" + "😀".repeat(479)), false);
});

test("rede: rotulo de host com 63 caracteres e aceito", () => {
  assert.equal(isValidNetworkUrl("website", `https://${"a".repeat(63)}.igreja.example.test`), true);
});

test("rede: rotulo de host com 64 caracteres e rejeitado", () => {
  assert.equal(
    isValidNetworkUrl("website", `https://${"a".repeat(64)}.igreja.example.test`),
    false,
  );
});

test("rede: caractere DEL no caminho e rejeitado", () => {
  assert.equal(isValidNetworkUrl("instagram", "https://instagram.com/a\x7f"), false);
});

const HOST_END_ACCEPTED = ["https://instagram.com?x=1", "https://instagram.com#frag"];

for (const value of HOST_END_ACCEPTED) {
  test(`rede: ? ou # logo depois do host e aceito: ${value}`, () => {
    assert.equal(isValidNetworkUrl("instagram", value), true);
  });
}

const HOST_END_REJECTED = [
  "https://evil.dev?.instagram.com/x",
  "https://evil.dev#.instagram.com/x",
];

for (const value of HOST_END_REJECTED) {
  test(`rede: host evil.dev com .instagram.com depois de ? ou # e rejeitado: ${value}`, () => {
    assert.equal(isValidNetworkUrl("instagram", value), false);
  });
}

test("links: omite valores invalidos e mantem o valido", () => {
  assert.deepEqual(
    build({
      contact: {
        website: "http://igreja.example.test",
        instagram: "javascript:alert(1)",
        facebook: "https://facebook.com/igreja",
        youtube: "https://youtu.be/abc",
      },
    }).links,
    [
      { key: "facebook", url: "https://facebook.com/igreja" },
      { key: "youtube", url: "https://youtu.be/abc" },
    ],
  );
});

const MEDIA_ALLOWED = "https://media.example.test/a.jpg";

test("midia: origem igual e permitida", () => {
  assert.equal(isAllowedMediaUrl(MEDIA_ALLOWED, MEDIA_ORIGIN), true);
});

const MEDIA_DENIED = [
  "https://media.example.test.evil.dev/a.jpg",
  "http://media.example.test/a.jpg",
  "https://media.example.test:8443/a.jpg",
  "https://u:p@media.example.test/a.jpg",
  "//media.example.test/a.jpg",
  "https://media.example.test\\.evil.dev/a.jpg",
  "https://media.example.test/a\\b.jpg",
  "https://other.example.test/a.jpg",
  "https://sub.media.example.test/a.jpg",
  "https://xmedia.example.test/a.jpg",
];

for (const url of MEDIA_DENIED) {
  test(`midia negada: ${JSON.stringify(url)}`, () => {
    assert.equal(isAllowedMediaUrl(url, MEDIA_ORIGIN), false);
  });
}

for (const origin of [undefined, "", "http://media.example.test", "nao e url"]) {
  test(`mediaOrigin invalido nega tudo: ${JSON.stringify(origin)}`, () => {
    assert.equal(isAllowedMediaUrl(MEDIA_ALLOWED, origin), false);
  });
}

test("midia: url nao string e negada", () => {
  assert.equal(isAllowedMediaUrl(null, MEDIA_ORIGIN), false);
});

test("midia: sem mediaOrigin o perfil nao renderiza nenhuma imagem", () => {
  assert.deepEqual(
    build({
      thumbnail: MEDIA_ALLOWED,
      mediaOrigin: undefined,
      photos: [{ type: "cover", url: "https://media.example.test/c.jpg" }],
    }),
    { features: [], links: [], logo: null, cover: null, gallery: [] },
  );
});

test("logo: thumbnail permitido vence a foto logo", () => {
  assert.equal(
    build({
      thumbnail: MEDIA_ALLOWED,
      photos: [{ type: "logo", url: "https://media.example.test/logo-foto.jpg" }],
    }).logo,
    MEDIA_ALLOWED,
  );
});

test("logo: thumbnail nao permitido cai para a foto logo permitida", () => {
  assert.equal(
    build({
      thumbnail: "https://outro.example.test/l.jpg",
      photos: [{ type: "logo", url: "https://media.example.test/logo-foto.jpg" }],
    }).logo,
    "https://media.example.test/logo-foto.jpg",
  );
});

test("logo: sem thumbnail e sem foto logo devolve null", () => {
  assert.equal(build({ thumbnail: null, photos: [] }).logo, null);
});

test("cover: primeira cover permitida, pulando a invalida", () => {
  assert.equal(
    build({
      photos: [
        { type: "cover", url: "https://outro.example.test/c0.jpg" },
        { type: "cover", url: "https://media.example.test/c1.jpg" },
      ],
    }).cover,
    "https://media.example.test/c1.jpg",
  );
});

test("cover: sem cover permitida devolve null", () => {
  assert.equal(build({ photos: [{ type: "cover", url: "http://media.example.test/c.jpg" }] }).cover, null);
});

const gallery11 = Array.from(
  { length: 11 },
  (_, index) => ({ type: "gallery", url: `https://media.example.test/g${index + 1}.jpg` }),
);

test("galeria: mantem 10 fotos", () => {
  assert.equal(build({ photos: gallery11 }).gallery.length, 10);
});

test("galeria: mantem a ordem e corta a 11a foto", () => {
  assert.equal(build({ photos: gallery11 }).gallery.at(-1), "https://media.example.test/g10.jpg");
});

test("galeria: ignora tipo desconhecido, sem url e entradas nao objeto", () => {
  assert.deepEqual(
    build({
      photos: [
        { type: "banner", url: "https://media.example.test/b.jpg" },
        { type: "Cover", url: "https://media.example.test/C.jpg" },
        { type: "gallery" },
        null,
        "https://media.example.test/s.jpg",
        7,
        { type: "gallery", url: "https://media.example.test/g2.jpg" },
        { type: "gallery", url: "https://outro.example.test/x.jpg" },
      ],
    }),
    { features: [], links: [], logo: null, cover: null, gallery: ["https://media.example.test/g2.jpg"] },
  );
});

test("fotos nao array: logo so do thumbnail, cover null e galeria vazia", () => {
  assert.deepEqual(
    build({
      thumbnail: MEDIA_ALLOWED,
      photos: { type: "cover", url: "https://media.example.test/c.jpg" },
    }),
    { features: [], links: [], logo: MEDIA_ALLOWED, cover: null, gallery: [] },
  );
});

test("cover: com duas capas permitidas vale a primeira", () => {
  assert.equal(
    build({
      photos: [
        { type: "cover", url: "https://media.example.test/c1.jpg" },
        { type: "cover", url: "https://media.example.test/c2.jpg" },
      ],
    }).cover,
    "https://media.example.test/c1.jpg",
  );
});

const MIX_LOGO = "https://media.example.test/logo.jpg";
const MIX_COVER = "https://media.example.test/capa.jpg";
const MIX_GALLERY_1 = "https://media.example.test/g1.jpg";
const MIX_GALLERY_2 = "https://media.example.test/g2.jpg";

const MIXED_PHOTOS = [
  { type: "gallery", url: MIX_GALLERY_1 },
  { type: "cover", url: MIX_COVER },
  { type: "logo", url: MIX_LOGO },
  { type: "gallery", url: MIX_GALLERY_2 },
];

test("fotos misturadas: logo vem so do tipo logo", () => {
  assert.equal(build({ photos: MIXED_PHOTOS }).logo, MIX_LOGO);
});

test("fotos misturadas: capa vem so do tipo cover", () => {
  assert.equal(build({ photos: MIXED_PHOTOS }).cover, MIX_COVER);
});

test("fotos misturadas: galeria so com as gallery, na ordem", () => {
  assert.deepEqual(build({ photos: MIXED_PHOTOS }).gallery, [MIX_GALLERY_1, MIX_GALLERY_2]);
});

test("fotos misturadas: galeria nao contem a capa", () => {
  assert.equal(build({ photos: MIXED_PHOTOS }).gallery.includes(MIX_COVER), false);
});

test("fotos misturadas: galeria nao contem o logo", () => {
  assert.equal(build({ photos: MIXED_PHOTOS }).gallery.includes(MIX_LOGO), false);
});

test("logo: sem thumbnail usa a foto logo permitida", () => {
  assert.equal(
    build({
      thumbnail: null,
      photos: [
        { type: "gallery", url: MIX_GALLERY_1 },
        { type: "logo", url: MIX_LOGO },
      ],
    }).logo,
    MIX_LOGO,
  );
});

test("logo: sem thumbnail a galeria segue so com as gallery", () => {
  assert.deepEqual(
    build({
      thumbnail: null,
      photos: [
        { type: "gallery", url: MIX_GALLERY_1 },
        { type: "logo", url: MIX_LOGO },
        { type: "gallery", url: MIX_GALLERY_2 },
      ],
    }).gallery,
    [MIX_GALLERY_1, MIX_GALLERY_2],
  );
});

type MessageTree = { [key: string]: string | MessageTree };
type Locale = "pt-BR" | "en";

const messagesDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src", "messages");

function readMessages(locale: Locale): { publicChurchProfile: MessageTree } {
  return JSON.parse(readFileSync(resolve(messagesDir, `${locale}.json`), "utf8"));
}

const MESSAGES: Record<Locale, { publicChurchProfile: MessageTree }> = {
  "pt-BR": readMessages("pt-BR"),
  en: readMessages("en"),
};

const LOCALES: Locale[] = ["pt-BR", "en"];

const PROFILE_KEYS = [
  "attributes.title",
  "networks.title",
  "networks.website",
  "networks.instagram",
  "networks.facebook",
  "networks.youtube",
  "networks.openAria",
  "gallery.title",
  "media.logoAlt",
  "media.coverAlt",
  "media.galleryAlt",
];

const PLACEHOLDERS: Array<[string, string[]]> = [
  ["networks.openAria", ["{network}", "{name}"]],
  ["media.logoAlt", ["{name}"]],
  ["media.coverAlt", ["{name}"]],
  ["media.galleryAlt", ["{index}", "{name}"]],
];

function messageAt(messages: MessageTree, dottedKey: string): unknown {
  return dottedKey.split(".").reduce<unknown>(
    (node, part) =>
      typeof node === "object" && node !== null ? (node as MessageTree)[part] : undefined,
    messages,
  );
}

function leafKeys(node: MessageTree, prefix = ""): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : leafKeys(value, `${prefix}${key}.`),
  );
}

for (const locale of LOCALES) {
  for (const key of PROFILE_KEYS) {
    test(`i18n ${locale}: publicChurchProfile.${key} e texto nao vazio`, () => {
      const value = messageAt(MESSAGES[locale].publicChurchProfile, key);

      assert.equal(typeof value, "string");
      assert.notEqual((value as string).trim(), "");
    });
  }

  test(`i18n ${locale}: publicChurchProfile tem exatamente as chaves da lista`, () => {
    assert.deepEqual(
      leafKeys(MESSAGES[locale].publicChurchProfile).sort(),
      [...PROFILE_KEYS].sort(),
    );
  });

  for (const [key, placeholders] of PLACEHOLDERS) {
    test(`i18n ${locale}: ${key} contem ${placeholders.join(" e ")}`, () => {
      const value = messageAt(MESSAGES[locale].publicChurchProfile, key) as string;

      for (const placeholder of placeholders) {
        assert.ok(value.includes(placeholder), `${key} sem ${placeholder}: ${value}`);
      }
    });
  }
}

test("i18n: pt-BR e en tem o mesmo conjunto de chaves sob publicChurchProfile", () => {
  assert.deepEqual(
    leafKeys(MESSAGES["pt-BR"].publicChurchProfile).sort(),
    leafKeys(MESSAGES.en.publicChurchProfile).sort(),
  );
});

test("i18n pt-BR: attributes.title e o literal O que a comunidade oferece", () => {
  assert.equal(
    messageAt(MESSAGES["pt-BR"].publicChurchProfile, "attributes.title"),
    "O que a comunidade oferece",
  );
});
