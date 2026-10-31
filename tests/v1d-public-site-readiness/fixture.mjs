import http from 'node:http';
import fs from 'node:fs';

export async function startFixture(mode, journal) {
  const churches = ['Alfa', 'Beta'].map((name, index) => ({
    id: `00000000-0000-4000-8000-00000000000${index + 1}`,
    slug: name.toLowerCase(), name: `Comunidade ${name}`, denomination: 'BATISTA',
    description: `Descrição pública sintética ${name}.`,
    address: {street: `Rua Sintética ${name}`, number: '10', neighborhood: 'Centro', city: 'Goiânia', state: 'GO'},
    location: {lat: -16.6869 + index / 1000, lng: -49.2648},
    contact: {}, schedule: [{title: `Encontro sintético ${name}`, day: 'SUNDAY', time: '10:00'}],
    member_count: index + 12, plan: 'FREE', is_live: false, donations_enabled: false,
    pix_key: null, thumbnail: null, photos: [], features: [],
  }));
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const search = url.searchParams.get('search') || '';
    let status = 200;
    let body;
    if (req.method !== 'GET') {
      status = 405; body = {message: 'fixture read only'};
    } else if (url.pathname === '/health') {
      body = {fixture: 'V1d synthetic', mode};
    } else if (mode === 'unavailable' || search === 'ErroSintetico' || url.pathname === '/api/v1/churches/slug/indisponivel') {
      status = 503; body = {statusCode: 503, message: 'Indisponibilidade sintética V1d'};
    } else if (url.pathname === '/api/v1/churches') {
      const data = mode === 'empty' ? [] : churches.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
      body = {data, meta: {page: 1, total_pages: 1, total: data.length, limit: 100}};
    } else if (url.pathname.startsWith('/api/v1/churches/slug/')) {
      const slug = url.pathname.split('/').at(-1);
      const church = churches.find(c => c.slug === slug);
      status = church ? 200 : 404;
      body = church ? {data: church} : {statusCode: 404, message: 'Comunidade sintética ausente'};
    } else {
      status = 404; body = {message: 'unexpected fixture path'};
    }
    fs.appendFileSync(journal, JSON.stringify({method: req.method, path: url.pathname, search, status, mode}) + '\n', {mode: 0o600});
    res.writeHead(status, {'content-type': 'application/json', 'cache-control': 'no-store'});
    res.end(JSON.stringify(body));
  });
  await new Promise((resolve, reject) => {server.once('error', reject); server.listen(0, '127.0.0.1', resolve);});
  return {server, origin: `http://127.0.0.1:${server.address().port}`};
}
