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

test('debug cadastro agencia', async ({ page }) => {
    const logs = [];
    page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

    await login(page);
    await page.goto(`${BASE}/agenciasCadastrar`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const ts = Date.now();
    const cnpjDigits = String(ts).slice(-8).padStart(8, '1') + '000195'

    await page.fill('input[name="razaoSocial"]', `Agencia Teste ${ts}`);
    await page.locator('input[name="cnpj"]').pressSequentially(cnpjDigits);
    await page.selectOption('select[name="tipo"]', 'master');
    await page.fill('input[name="nomeContato"]', 'Responsavel');
    await page.locator('input[name="celular"]').pressSequentially('11999999999');
    await page.fill('input[name="emailContato"]', `ag${ts}@teste.com`);
    await page.fill('input[name="logradouro"]', 'Rua Teste');
    await page.fill('input[name="cidade"]', 'Sao Paulo');
    await page.fill('input[name="estado"]', 'SP');

    // Checa quais campos required ainda estão vazios
    const invalidFields = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[required], select[required]');
        return [...inputs]
            .filter(el => !el.validity.valid)
            .map(el => ({ name: el.name, value: el.value, validity: el.validationMessage }));
    });
    console.log('Campos inválidos antes do submit:', JSON.stringify(invalidFields));

    await page.screenshot({ path: '/tmp/cadastro-debug.png', fullPage: false });

    // Submete diretamente via JS para bypass HTML validation e ver se o formHandler roda
    const networkCalled = await page.evaluate(() => {
        return new Promise(resolve => {
            const form = document.querySelector('form');
            form.reportValidity();
            resolve(form.checkValidity());
        });
    });
    console.log('Form válido:', networkCalled);
    console.log('Logs:', logs.slice(0, 10));
});
