import assert from "node:assert/strict";
import { test } from "node:test";

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
