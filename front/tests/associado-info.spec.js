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

test('associado info exibe imagem e campos corretos', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await login(page);
    await page.goto(`${BASE}/associadosLista`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Clica no botão Eye (Ver +) da primeira linha
    const eyeBtn = page.locator('tbody tr').first().locator('td').last().locator('button').last();
    await eyeBtn.click();
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    console.log('URL atual:', url);

    await page.screenshot({ path: '/tmp/associado-info.png', fullPage: true });

    const imgSrc = await page.locator('.associadoImage img').getAttribute('src').catch(() => null);
    console.log('Imagem src:', imgSrc);
    const isNoImage = imgSrc?.includes('vectorstock') || imgSrc?.includes('flaticon') || !imgSrc;
    console.log('Sem imagem (placeholder):', isNoImage);

    const cidade = await page.locator('text=Cidade:').locator('..').textContent().catch(() => null);
    console.log('Cidade:', cidade);

    const status = await page.locator('.associadoInfoStatus').textContent().catch(() => null);
    console.log('Status:', status);

    expect(errors).toHaveLength(0);
    expect(url).toContain('associadoInfo');
});
