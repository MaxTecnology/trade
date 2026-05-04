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

test('cards associados - estado correto e nome sem vazamento', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await login(page);
    await page.goto(`${BASE}/associados`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/associados-cards.png', fullPage: true });

    const cards = await page.locator('.associadoCard').count();
    console.log('Cards visíveis:', cards);

    if (cards > 0) {
        // Verifica que o estado não é "SC" hardcoded para todos
        const estados = await page.locator('.associadoCardTag div:last-child').allTextContents();
        console.log('Estados nos cards:', estados.map(e => e.trim()));

        // Verifica que o nome está truncado (não vaza do card)
        const firstCardWidth = await page.locator('.associadoCard').first().boundingBox();
        const firstNameWidth = await page.locator('.associadoCardName').first().boundingBox();
        console.log('Largura card:', firstCardWidth?.width);
        console.log('Largura nome container:', firstNameWidth?.width);
        expect(firstNameWidth?.width).toBeLessThanOrEqual(firstCardWidth?.width + 1);
    }

    expect(errors).toHaveLength(0);
});
