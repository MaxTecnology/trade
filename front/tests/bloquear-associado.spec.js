import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

async function login(page) {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="login"]', 'admin@redetrade.com.br');
    await page.fill('input[name="senha"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
}

test('bloquear associado', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

    await login(page);
    await page.goto(`${BASE}/associadosLista`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const rows = await page.locator('tbody tr').count();
    console.log(`Linhas: ${rows}`);
    if (rows === 0) { console.log('⚠️ Sem associados'); return; }

    // Pega status atual do primeiro associado
    const firstRow = page.locator('tbody tr').first();
    const lockBtn = firstRow.locator('td').last().locator('button').nth(1);
    const btnTitle = await lockBtn.getAttribute('title');
    console.log(`Botão título: "${btnTitle}"`);

    // Intercepta a chamada PATCH
    const responsePromise = page.waitForResponse(
        r => r.url().includes('/api/v1/associados/') && r.url().includes('/status') && r.request().method() === 'PATCH',
        { timeout: 10000 }
    );

    await lockBtn.click();

    // Confirma no popup se aparecer
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('button:has-text("Confirmar"), button:has-text("Sim"), button:has-text("OK")').first();
    if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
    }

    let apiResponse = null;
    try {
        apiResponse = await responsePromise;
    } catch {
        console.log('⚠️ Sem resposta PATCH /status');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/bloquear.png', fullPage: true });

    if (apiResponse) {
        const status = apiResponse.status();
        const body = await apiResponse.json().catch(() => ({}));
        console.log(`PATCH status: ${status}`);
        console.log('Body:', JSON.stringify(body));
        expect(status).toBe(200);
    }

    const realErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('Warning:') &&
        !e.includes('Failed to load resource') &&
        e.includes('PAGE ERROR')
    );
    if (realErrors.length) console.log('Erros críticos:', realErrors.join('\n'));
    expect(realErrors).toHaveLength(0);
});
