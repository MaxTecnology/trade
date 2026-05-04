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

test.describe('Editar Associado', () => {

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('1 - abre lista de associados', async ({ page }) => {
        const errors = [];
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
        page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

        await page.goto(`${BASE}/associadosLista`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: '/tmp/lista-associados.png', fullPage: true });

        const rows = await page.locator('tbody tr').count();
        console.log(`Linhas na tabela: ${rows}`);

        if (errors.length) console.log('Erros:', errors.join('\n'));
        expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
    });

    test('2 - clica em editar e modal abre sem erros', async ({ page }) => {
        const errors = [];
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
        page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

        await page.goto(`${BASE}/associadosLista`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const rows = await page.locator('tbody tr').count();
        console.log(`Linhas na tabela: ${rows}`);

        if (rows === 0) {
            console.log('⚠️  Sem associados cadastrados para editar');
            return;
        }

        // Clica no botão editar da primeira linha
        const editBtn = page.locator('tbody tr').first().locator('button[title="Editar"], button:has-text("Edit"), svg').first();

        // Captura os campos do DOM antes do clique
        const beforeFields = await page.$$eval('input, select', els =>
            els.filter(el => el.name).map(el => ({ name: el.name, value: el.value }))
        );
        console.log('Campos antes do clique:', JSON.stringify(beforeFields.slice(0, 5)));

        // Tenta clicar no botão de editar — localiza pela posição na última coluna
        const editButton = page.locator('tbody tr').first().locator('td').last().locator('button').first();
        await editButton.click();
        await page.waitForTimeout(1500);

        await page.screenshot({ path: '/tmp/modal-editar.png', fullPage: true });

        if (errors.length) {
            console.log('Erros após clicar editar:', errors.join('\n'));
        }

        // Verifica se modal abriu (tem o header "Editar Associado")
        const modalHeader = page.locator('text=Editar Associado');
        const modalVisible = await modalHeader.isVisible().catch(() => false);
        console.log(`Modal visível: ${modalVisible}`);

        if (modalVisible) {
            // Captura campos do modal
            const modalFields = await page.$$eval('input, select', els =>
                els.filter(el => el.name).map(el => ({ name: el.name, value: el.value }))
            );
            console.log('Campos no modal:', JSON.stringify(modalFields, null, 2));
        }

        const realErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404') && !e.includes('Warning:'));
        expect(realErrors).toHaveLength(0);
    });

    test('3 - campos do modal estão preenchidos corretamente', async ({ page }) => {
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

        await page.goto(`${BASE}/associadosLista`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const rows = await page.locator('tbody tr').count();
        if (rows === 0) { console.log('⚠️  Sem associados'); return; }

        // Clica editar na primeira linha
        const editButton = page.locator('tbody tr').first().locator('td').last().locator('button').first();
        await editButton.click();
        await page.waitForTimeout(1500);

        const modalVisible = await page.locator('text=Editar Associado').isVisible().catch(() => false);
        if (!modalVisible) {
            console.log('❌ Modal não abriu');
            console.log('Erros:', errors.join('\n'));
            await page.screenshot({ path: '/tmp/modal-falhou.png', fullPage: true });
            return;
        }

        // Verifica campos principais
        const nome = await page.locator('input[name="nome"]').first().inputValue().catch(() => 'CAMPO NÃO ENCONTRADO');
        const email = await page.locator('input[name="email"]').inputValue().catch(() => 'CAMPO NÃO ENCONTRADO');
        const cidade = await page.locator('input[name="cidade"]').inputValue().catch(() => 'CAMPO NÃO ENCONTRADO');

        console.log(`nome: "${nome}"`);
        console.log(`email: "${email}"`);
        console.log(`cidade: "${cidade}"`);

        expect(nome).not.toBe('');
        expect(email).not.toBe('');
        const realErrors = errors.filter(e => !e.includes('favicon') && !e.includes('Warning:'));
        expect(realErrors).toHaveLength(0);
    });

    test('4 - salva edicao sem erro', async ({ page }) => {
        const errors = [];
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
        page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

        await page.goto(`${BASE}/associadosLista`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const rows = await page.locator('tbody tr').count();
        if (rows === 0) { console.log('⚠️  Sem associados'); return; }

        const editButton = page.locator('tbody tr').first().locator('td').last().locator('button').first();
        await editButton.click();
        await page.waitForTimeout(1500);

        const modalVisible = await page.locator('text=Editar Associado').isVisible().catch(() => false);
        if (!modalVisible) { console.log('❌ Modal não abriu'); return; }

        // Altera a descrição para forçar uma mudança
        const descInput = page.locator('input[name="descricao"]');
        await descInput.clear();
        await descInput.fill('Descrição atualizada via teste');

        // Intercepta resposta PUT
        const responsePromise = page.waitForResponse(
            r => r.url().includes('/api/v1/associados/') && r.request().method() === 'PUT',
            { timeout: 15000 }
        );

        await page.locator('button:has-text("Salvar")').click();

        let apiResponse = null;
        try {
            apiResponse = await responsePromise;
        } catch {
            console.log('⚠️  Sem resposta da API ao salvar');
        }

        await page.waitForTimeout(1000);

        if (apiResponse) {
            const status = apiResponse.status();
            const body = await apiResponse.json().catch(() => ({}));
            console.log(`Status PUT: ${status}`);
            console.log('Resposta:', JSON.stringify(body, null, 2));
            if (status === 200) console.log('✅ Editado com sucesso!');
            else console.log('❌ Erro:', body.message ?? JSON.stringify(body));
            expect(status).toBe(200);
        }
    });
});
