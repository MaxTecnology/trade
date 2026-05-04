import { test } from '@playwright/test';

test('screenshot do formulário', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="login"]', 'admin@redetrade.com.br');
    await page.fill('input[name="senha"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.goto('http://localhost:5173/associadosCadastrar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/form-associado.png', fullPage: true });

    // Pega os nomes de todos os inputs e selects
    const inputs = await page.$$eval('input, select, textarea', els =>
        els.map(el => ({ tag: el.tagName, name: el.name, id: el.id, type: el.type }))
    );
    console.log('Campos no DOM:', JSON.stringify(inputs, null, 2));
});
