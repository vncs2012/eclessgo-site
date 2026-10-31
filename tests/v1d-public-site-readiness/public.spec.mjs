// Outcomes fixed by V1D-03..06 before execution. No browser route mocks local BFF.
export async function publicJourney({page, expect, origin, mode, capture, check, report}) {
  const failures = [];
  async function assertion(originalLine, run) {
    try {
      await run();
      report({originalLine, status: 'PASS'});
    } catch (error) {
      report({originalLine, status: 'FAIL', message: error.stack});
      failures.push(error);
      await capture(`assertion-${originalLine}-FAIL`);
    }
  }
  async function goto(path) {
    const response = await page.goto(origin + path);
    await page.locator('main, h1').first().waitFor();
    return response;
  }
  async function screen(name) {
    const widths = await page.evaluate(() => ({document: document.documentElement.scrollWidth, viewport: innerWidth}));
    await assertion(10, async () => {
    check(`${name} no horizontal overflow`, widths.document <= widths.viewport, true, 'V1D-06');
    });
    await capture(name);
  }
  const status = page.locator('p[role="status"][aria-live="polite"]');
  if (mode === 'healthy') {
    await assertion(15, async () => {
    check('home HTTP', (await goto('/')).status(), 200, 'V1D-03');
    });
    await assertion(16, async () => {
    await expect(page.locator('main')).toContainText('Comunidade Alfa');
    });
    await assertion(17, async () => {
    await expect(page.locator('main')).toContainText('Comunidade Beta');
    });
    await screen('home');
    await page.locator('a[href="/comunidades"]:visible').first().click();
    await assertion(20, async () => {
    await expect(page).toHaveURL(origin + '/comunidades');
    });
    await assertion(21, async () => {
    await expect(page.getByRole('heading', {name: 'Comunidade Alfa', exact: true}).first()).toBeVisible();
    });
    await assertion(22, async () => {
    await expect(page.getByRole('heading', {name: 'Comunidade Beta', exact: true}).first()).toBeVisible();
    });
    await screen('directory');
    const input = page.getByRole('textbox', {name: 'Buscar comunidades'});
    const submit = page.locator('form button[type="submit"]');
    const searchResponse = page.waitForResponse(r => new URL(r.url()).pathname === '/api/public/churches');
    await input.fill('Alfa');
    await submit.click();
    await assertion(29, async () => {
    check('search Alfa BFF HTTP', (await searchResponse).status(), 200, 'V1D-03');
    });
    await assertion(30, async () => {
    await expect(status).toHaveText('Diretório público atualizado com base na sua busca.');
    });
    await assertion(31, async () => {
    await expect(page.getByRole('heading', {name: 'Comunidade Alfa', exact: true}).first()).toBeVisible();
    });
    await assertion(32, async () => {
    await expect(page.getByRole('heading', {name: 'Comunidade Beta', exact: true})).toHaveCount(0);
    });
    await screen('search-alfa');
    await page.locator('a[href="/comunidades/alfa"]').first().click();
    await assertion(35, async () => {
    await expect(page).toHaveURL(origin + '/comunidades/alfa');
    });
    await assertion(36, async () => {
    await expect(page.getByRole('heading', {name: 'Comunidade Alfa', exact: true})).toBeVisible();
    });
    await assertion(37, async () => {
    await expect(page.locator('main')).toContainText('Descrição pública sintética Alfa.');
    });
    await assertion(38, async () => {
    await expect(page.locator('main')).toContainText('Rua Sintética Alfa, 10, Centro, Goiânia, GO');
    });
    await assertion(39, async () => {
    await expect(page.locator('main')).toContainText('Encontro sintético Alfa');
    });
    await screen('detail');
    await page.getByRole('link', {name: 'Voltar ao mapa de comunidades'}).click();
    await assertion(42, async () => {
    await expect(page).toHaveURL(origin + '/comunidades');
    });
    await input.fill('SemResultado');
    await submit.click();
    await assertion(45, async () => {
    await expect(status).toHaveText('Nenhuma comunidade encontrada para os filtros informados.');
    });
    await assertion(46, async () => {
    await expect(page.getByText('Nenhuma comunidade encontrada', {exact: true})).toBeVisible();
    });
    await assertion(47, async () => {
    await expect(page.getByRole('heading', {name: 'Comunidade Alfa', exact: true})).toHaveCount(0);
    });
    await screen('search-empty');
    const errorResponse = page.waitForResponse(r => new URL(r.url()).pathname === '/api/public/churches');
    await input.fill('ErroSintetico');
    await submit.click();
    await assertion(52, async () => {
    check('search503 BFF HTTP', (await errorResponse).status(), 502, 'V1D-05');
    });
    await assertion(53, async () => {
    await expect(status).toHaveText('Não foi possível aplicar os filtros agora.');
    });
    await screen('search-unavailable');
    await assertion(55, async () => {
    check('legacy directory HTTP', (await goto('/igrejas')).status(), 200, 'V1D-03');
    });
    await assertion(56, async () => {
    await expect(page.getByRole('heading', {name: 'Comunidade Beta', exact: true}).first()).toBeVisible();
    });
    await assertion(57, async () => {
    check('legacy detail HTTP', (await goto('/igrejas/alfa')).status(), 200, 'V1D-04');
    });
    await assertion(58, async () => {
    await expect(page.getByRole('heading', {name: 'Comunidade Alfa', exact: true})).toBeVisible();
    });
    await assertion(59, async () => {
    check('missing slug HTTP', (await goto('/comunidades/ausente')).status(), 404, 'V1D-04');
    });
    await assertion(60, async () => {
    await expect(page.getByRole('heading', {name: 'Esta página não foi encontrada', exact: true})).toBeVisible();
    });
    await screen('not-found');
    await assertion(62, async () => {
    check('upstream503 informative HTTP', (await goto('/comunidades/indisponivel')).status(), 200, 'V1D-04');
    });
    await assertion(63, async () => {
    await expect(page.getByRole('heading', {name: 'Esta página está temporariamente indisponível', exact: true})).toBeVisible();
    });
    await assertion(64, async () => {
    await expect(page.locator('main')).not.toContainText('Comunidade Alfa');
    });
    await assertion(65, async () => {
    await expect(page.getByRole('link', {name: 'Tentar novamente'})).toHaveAttribute('href', '/comunidades/indisponivel');
    });
    await screen('detail-unavailable');
  } else {
    await assertion(68, async () => {
    check(`${mode} home HTTP`, (await goto('/')).status(), 200, 'V1D-05');
    });
    const homeText = mode === 'empty'
      ? 'Nenhuma comunidade com coordenadas válidas foi encontrada para a prévia. O site segue funcional e o cadastro público já está pronto para abastecer o mapa.'
      : 'A API pública do EclessGO não respondeu agora. A prévia do mapa volta a carregar assim que o backend estiver ativo.';
    await assertion(72, async () => {
    await expect(page.getByText(homeText, {exact: true})).toBeVisible();
    });
    await assertion(73, async () => {
    await expect(page.locator('main')).not.toContainText('Comunidade Alfa');
    });
    await screen(`${mode}-home`);
    await page.locator('a[href="/comunidades"]:visible').first().click();
    await assertion(76, async () => {
    await expect(page).toHaveURL(origin + '/comunidades');
    });
    await assertion(77, async () => {
    await expect(status).toHaveText(mode === 'empty'
      ? 'Nenhuma comunidade com coordenadas válidas foi encontrada nesta área.'
      : 'Não foi possível carregar o diretório público agora porque a API do EclessGO não respondeu.');
    });
    if (mode === 'empty') {
      await assertion(81, async () => {
      await expect(page.getByText('Nenhuma comunidade encontrada', {exact: true})).toBeVisible();
      });
    } else {
      await assertion(83, async () => {
      await expect(page.getByText('Não foi possível carregar o diretório público agora porque a API do EclessGO não respondeu.', {exact: true}).first()).toBeVisible();
      });
    }
    await screen(`${mode}-directory`);
  }
  if (failures.length) throw new AggregateError(failures, 'V1d assertions failed; no failure suppressed');
}
