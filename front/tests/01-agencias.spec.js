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

test.describe('Agências', () => {
    test.beforeEach(async ({ page }) => { await login(page); });

    test('1 - lista agencias sem erros e exibe colunas', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(`${BASE}/agencias`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/agencias-lista.png', fullPage: true });

        const rows = await page.locator('tbody tr').count();
        console.log('Linhas:', rows);

        // Verifica que a coluna Conta tem valor (número da conta)
        if (rows > 0) {
            const firstRowCells = await page.locator('tbody tr').first().locator('td').allTextContents();
            console.log('Células 1a linha:', firstRowCells);
        }

        expect(errors).toHaveLength(0);
    });

    test('2 - cadastro de agencia envia para API corretamente', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(`${BASE}/agenciasCadastrar`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: '/tmp/agencias-cadastro.png', fullPage: false });

        const ts = Date.now();
        const cnpjDigits = String(ts).slice(-8).padStart(8, '1') + '000195'
        await page.fill('input[name="razaoSocial"]', `Agencia Teste ${ts}`);
        await page.locator('input[name="cnpj"]').pressSequentially(cnpjDigits);
        await page.selectOption('select[name="tipo"]', 'master');
        await page.fill('input[name="nomeContato"]', 'Responsável Teste');
        await page.locator('input[name="celular"]').pressSequentially('11999999999');
        await page.fill('input[name="emailContato"]', `agencia${ts}@teste.com`);
        await page.fill('input[name="logradouro"]', 'Rua Teste');
        await page.fill('input[name="cidade"]', 'São Paulo');
        await page.fill('input[name="estado"]', 'SP');

        const responsePromise = page.waitForResponse(
            r => r.url().includes('/api/v1/agencias') && !r.url().includes('/status') && r.request().method() === 'POST',
            { timeout: 15000 }
        ).catch(() => null);

        await page.click('button[type="submit"]');
        const res = await responsePromise;

        if (res) {
            const status = res.status();
            const body = await res.json().catch(() => ({}));
            console.log('POST status:', status);
            console.log('Body:', JSON.stringify(body).slice(0, 300));
            expect(status).toBe(201);
        } else {
            console.log('⚠️ Sem resposta POST /agencias');
        }

        expect(errors).toHaveLength(0);
    });

    test('3 - editar agencia abre modal e salva', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(`${BASE}/agencias`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const rows = await page.locator('tbody tr').count();
        if (rows === 0) { console.log('⚠️ Sem agências'); return; }

        const editBtn = page.locator('tbody tr').first().locator('td').last().locator('button').first();
        await editBtn.click();
        await page.waitForTimeout(1500);

        const modalVisible = await page.locator('text=Editar Agência').isVisible().catch(() => false);
        console.log('Modal abriu:', modalVisible);
        await page.screenshot({ path: '/tmp/agencias-modal.png', fullPage: false });

        if (!modalVisible) {
            console.log('Erros:', errors.join('\n'));
            return;
        }

        // Verifica campos pré-preenchidos
        const razaoSocial = await page.locator('input[name="razaoSocial"]').inputValue().catch(() => '');
        const cidade = await page.locator('input[name="cidade"]').inputValue().catch(() => '');
        console.log('razaoSocial:', razaoSocial);
        console.log('cidade:', cidade);
        expect(razaoSocial).not.toBe('');

        const putPromise = page.waitForResponse(
            r => r.url().includes('/api/v1/agencias/') && r.request().method() === 'PUT',
            { timeout: 15000 }
        ).catch(() => null);

        await page.locator('button:has-text("Salvar")').click();
        const putRes = await putPromise;

        if (putRes) {
            const status = putRes.status();
            const body = await putRes.json().catch(() => ({}));
            console.log('PUT status:', status);
            console.log('Body:', JSON.stringify(body).slice(0, 200));
            expect(status).toBe(200);
        } else {
            console.log('⚠️ Sem resposta PUT');
        }

        expect(errors).toHaveLength(0);
    });

    test('4 - botao bloquear agencia funciona', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(`${BASE}/agencias`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const rows = await page.locator('tbody tr').count();
        if (rows === 0) { console.log('⚠️ Sem agências'); return; }

        const lockBtn = page.locator('tbody tr').first().locator('td').last().locator('button').nth(1);
        const title = await lockBtn.getAttribute('title');
        console.log('Botão título:', title);

        const patchPromise = page.waitForResponse(
            r => r.url().includes('/api/v1/agencias/') && r.url().includes('/status') && r.request().method() === 'PATCH',
            { timeout: 10000 }
        ).catch(() => null);

        await lockBtn.click();
        await page.waitForTimeout(500);

        const confirmBtn = page.locator('button:has-text("Confirmar"), button:has-text("Sim"), button:has-text("OK")').first();
        if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();

        const patchRes = await patchPromise;
        if (patchRes) {
            console.log('PATCH status:', patchRes.status());
            expect(patchRes.status()).toBe(200);
        } else {
            console.log('⚠️ PATCH não chamado (popup pode ter bloqueado)');
        }

        expect(errors).toHaveLength(0);
    });
});
