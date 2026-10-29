'use strict';
const test = require('node:test');
const { assert, React, mount, json, deferred } = require('./ui-isolation.cjs');

function noInformation(slug = 'test-church') {
  return { slug, status: 'no_information', answer: [], sources: [] };
}
function answered(slug = 'test-church', text = 'Published fact') {
  return { slug, status: 'answered', answer: [text], sources: [{ factId: 'church-name', href: '/comunidades/' + slug }] };
}

test('both languages show a momentary availability snapshot and never ask automatically', async () => {
  for (const [locale, ready, unavailable] of [
    ['en', 'When this page opened, the assistant might be able to answer. Availability is checked for each question.',
      'The assistant was unavailable when this page opened. You can still try a question.'],
    ['pt-BR', 'Ao abrir a página, o assistente poderia responder. A disponibilidade é verificada a cada pergunta.',
      'O assistente estava indisponível ao abrir esta página. Você pode tentar uma pergunta.'],
  ]) {
    for (const available of [true, false]) {
      let calls = 0;
      globalThis.fetch = async (url, init) => {
        calls++;
        assert.equal(url, '/api/public/churches/slug/test-church/assistant');
        assert.equal(init.method, 'POST');
        assert.equal(init.credentials, 'omit');
        assert.equal(init.cache, 'no-store');
        assert.equal(new Headers(init.headers).has('authorization'), false);
        assert.equal(new Headers(init.headers).has('cookie'), false);
        const body = JSON.parse(init.body);
        assert.deepEqual(Object.keys(body).sort(), ['locale', 'question']);
        assert.equal(body.locale, locale);
        return json(noInformation());
      };
      const view = await mount({ locale, available });
      assert.equal(calls, 0);
      assert.ok(view.node.textContent.includes(available ? ready : unavailable));
      assert.ok(view.node.querySelector('label[for="public-information-assistant-question"]'));
      assert.ok(view.node.textContent.includes(locale === 'en'
        ? 'Do not include personal or private information in your question.'
        : 'Não informe dados pessoais ou informações privadas na sua pergunta.'));
      assert.equal(/api key|chave de api|model|modelo|anthropic|openai/i.test(view.node.textContent), false);
      await view.question('Synthetic question');
      assert.equal(view.node.querySelector('button[type="submit"]').disabled, false);
      await view.submit();
      await view.flush();
      assert.equal(calls, 1);
      assert.ok(view.node.textContent.includes(locale === 'en'
        ? 'I couldn’t find published information to answer this question.'
        : 'Não encontrei informação publicada para responder a esta pergunta.'));
      await view.close();
    }
  }
});

test('500 code points are accepted, 501 blocked, and pending submission is single-flight', async () => {
  let calls = 0;
  const pending = deferred();
  globalThis.fetch = async () => { calls++; return pending.promise; };
  const view = await mount({ available: true });
  await view.question('😀'.repeat(500));
  assert.equal(view.node.querySelector('button[type="submit"]').disabled, false);
  await view.question('😀'.repeat(501));
  assert.equal(view.node.querySelector('button[type="submit"]').disabled, true);
  await view.submit();
  assert.equal(calls, 0);
  await view.question('😀'.repeat(500));
  await view.submit();
  await view.submit();
  assert.equal(calls, 1);
  assert.equal(view.node.querySelector('textarea').disabled, true);
  assert.equal(view.node.querySelector('button[type="submit"]').disabled, true);
  assert.ok(view.node.querySelector('[role="status"]'));
  await React.act(async () => { pending.resolve(json(noInformation())); });
  await view.flush();
  assert.equal(view.node.querySelector('textarea').disabled, false);
  await view.close();
});

test('answers are escaped and sources remain local', async () => {
  globalThis.fetch = async () => json(answered('test-church', '<img src=x onerror=alert(1)>'));
  const view = await mount({ available: true });
  await view.question('Synthetic question');
  await view.submit();
  await view.flush();
  assert.equal(view.node.querySelector('img'), null);
  assert.ok(view.node.textContent.includes('<img src=x onerror=alert(1)>'));
  const links = [...view.node.querySelectorAll('ol a')];
  assert.equal(links.length, 1);
  assert.equal(links[0].getAttribute('href'), '/comunidades/test-church');
  await view.close();
});

test('503 not configured, generic failure and invalid response are localized and retryable', async () => {
  for (const [locale, notConfigured, unavailable, invalid] of [
    ['en', 'The assistant can’t answer yet. Please try again later.',
      'We couldn’t answer right now. Please try again.', 'We couldn’t validate this response. Please try again.'],
    ['pt-BR', 'O assistente ainda não pode responder. Tente novamente mais tarde.',
      'Não foi possível responder agora. Tente novamente.', 'Não foi possível validar esta resposta. Tente novamente.'],
  ]) {
    const responses = [
      json({ code: 'ASSISTANT_NOT_CONFIGURED' }, 503),
      json({ code: 'PRIVATE_ERROR', detail: 'do-not-echo' }, 503),
      json({ ...answered(), sources: [{ factId: 'church-name', href: 'https://bad.invalid' }] }),
      json(answered('other-slug')),
      json(answered()),
    ];
    globalThis.fetch = async () => responses.shift();
    const view = await mount({ locale, available: true });
    for (const expected of [notConfigured, unavailable, invalid, invalid]) {
      await view.question('Synthetic question');
      await view.submit();
      await view.flush();
      assert.ok(view.node.querySelector('[role="alert"]').textContent.includes(expected));
      assert.equal(view.node.textContent.includes('do-not-echo'), false);
      assert.equal(view.node.querySelector('ol'), null);
    }
    await view.question('Synthetic question');
    await view.submit();
    await view.flush();
    assert.ok(view.node.textContent.includes('Published fact'));
    assert.equal(view.node.querySelector('[role="alert"]'), null);
    await view.close();
  }
});

test('slug and locale changes abort pending requests, clear context and discard late results', async () => {
  const requests = [];
  globalThis.fetch = async (_url, init) => {
    const pending = deferred();
    requests.push({ pending, signal: init.signal });
    return pending.promise;
  };
  const view = await mount({ available: true });
  await view.question('Old context');
  await view.submit();
  assert.equal(requests.length, 1);
  await view.render({ slug: 'other-church' });
  assert.equal(requests[0].signal.aborted, true);
  assert.equal(view.node.querySelector('textarea').value, '');
  await React.act(async () => { requests[0].pending.resolve(json(answered('test-church', 'OLD RESULT'))); });
  await view.flush();
  assert.equal(view.node.textContent.includes('OLD RESULT'), false);

  await view.question('Second context');
  await view.submit();
  assert.equal(requests.length, 2);
  await view.render({ locale: 'pt-BR' });
  assert.equal(requests[1].signal.aborted, true);
  assert.equal(view.node.querySelector('textarea').value, '');
  await React.act(async () => { requests[1].pending.resolve(json(answered('other-church', 'STALE RESULT'))); });
  await view.flush();
  assert.equal(view.node.textContent.includes('STALE RESULT'), false);
  assert.equal(view.node.querySelector('ol'), null);

  await view.question('Unmounted');
  await view.submit();
  assert.equal(requests.length, 3);
  await view.close();
  assert.equal(requests[2].signal.aborted, true);
  await React.act(async () => { requests[2].pending.resolve(json(answered('other-church', 'LATE'))); });
});

test('only ten completed turns remain in memory and history is never sent', async () => {
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++;
    assert.deepEqual(Object.keys(JSON.parse(init.body)).sort(), ['locale', 'question']);
    return json(noInformation());
  };
  const view = await mount({ available: true });
  for (let i = 1; i <= 11; i++) {
    await view.question('Question ' + i);
    await view.submit();
    await view.flush();
  }
  const turns = [...view.node.querySelectorAll('ol > li')];
  assert.equal(calls, 11);
  assert.equal(turns.length, 10);
  assert.equal(turns[0].querySelector('p').textContent.trim(), 'You: Question 2');
  assert.equal(turns[9].querySelector('p').textContent.trim(), 'You: Question 11');
  await view.close();
});

test('changing slug or locale clears already completed conversation and aborts the next request', async () => {
  for (const change of [{ slug: 'other-church' }, { locale: 'pt-BR' }]) {
    const pending = deferred();
    let calls = 0, signal;
    globalThis.fetch = async (_url, init) => {
      calls++;
      if (calls === 1) return json(noInformation());
      signal = init.signal;
      return pending.promise;
    };
    const view = await mount({ available: true });
    await view.question('Completed turn');
    await view.submit();
    await view.flush();
    assert.equal(view.node.querySelectorAll('ol > li').length, 1);
    await view.question('Pending turn');
    await view.submit();
    await view.render(change);
    assert.equal(signal.aborted, true);
    assert.equal(view.node.querySelector('ol'), null);
    assert.equal(view.node.querySelector('textarea').value, '');
    await React.act(async () => { pending.resolve(json(answered('test-church', 'STALE RESULT'))); });
    await view.flush();
    assert.equal(view.node.textContent.includes('STALE RESULT'), false);
    await view.close();
  }
});
