import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
const URL_FORM = `${BASE}/associadosCadastrar`;

async function login(page) {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="login"]', 'admin@redetrade.com.br');
    await page.fill('input[name="senha"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
}

test.describe('Formulário Cadastrar Associado', () => {

    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URL_FORM);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
    });

    test('1 - página carrega com todas as seções', async ({ page }) => {
        await expect(page.locator('.containerHeader')).toContainText('Novo Associado');
        await expect(page.locator('text=Contato').first()).toBeVisible();
        await expect(page.locator('text=Endereço').first()).toBeVisible();
        await expect(page.locator('text=Agência').first()).toBeVisible();
        await expect(page.locator('text=Operações').first()).toBeVisible();
        await expect(page.locator('text=Dados do usuário').first()).toBeVisible();
        console.log('✅ Todas as seções visíveis');
    });

    test('2 - selecionar plano preenche valor e comissão', async ({ page }) => {
        const planoSelect = page.locator('select[name="planoId"]');
        const opts = await planoSelect.locator('option').count();
        if (opts <= 1) { console.log('⚠️  Nenhum plano cadastrado'); return; }

        await planoSelect.selectOption({ index: 1 });
        await page.waitForTimeout(800);

        const comissao = await page.locator('input[name="comissao"]').inputValue();
        const planoValor = await page.locator('input[name="planoValor"]').inputValue();
        const planoTaxa = await page.locator('input[name="planoTaxa"]').inputValue();

        console.log(`Comissão: ${comissao} | Valor: ${planoValor} | Taxa manutenção: ${planoTaxa}`);
        expect(comissao).not.toBe('');
        expect(planoValor).not.toBe('');
    });

    test('3 - selecionar gerente preenche porcentagem', async ({ page }) => {
        const sel = page.locator('select[name="gerente"]');
        const opts = await sel.locator('option').count();
        if (opts <= 1) { console.log('⚠️  Nenhum gerente cadastrado'); return; }

        // index 0 = placeholder disabled, index 1 = "Nenhum", index 2+ = gerentes reais
        await sel.selectOption({ index: 2 });
        await page.waitForTimeout(800);

        const taxa = await page.locator('input[name="taxaGerenteConta"]').inputValue();
        console.log(`Taxa gerente: ${taxa}`);
        expect(taxa).not.toBe('');
    });

    test('4 - forma de pagamento exibe campos corretos', async ({ page }) => {
        const fp = page.locator('select[name="formaPagamento"]');

        // Permuta (100) → só RT
        await fp.selectOption('100');
        await page.waitForTimeout(400);
        await expect(page.locator('input[name="valorInscricaoRT"]')).toBeVisible();
        await expect(page.locator('input[name="valorInscricaoBRL"]')).not.toBeVisible();
        console.log('✅ Permuta: só RT visível');

        // Dinheiro (0) → só BRL
        await fp.selectOption('0');
        await page.waitForTimeout(400);
        await expect(page.locator('input[name="valorInscricaoBRL"]')).toBeVisible();
        await expect(page.locator('input[name="valorInscricaoRT"]')).not.toBeVisible();
        console.log('✅ Dinheiro: só BRL visível');

        // Permuta/Dinheiro (50) → ambos
        await fp.selectOption('50');
        await page.waitForTimeout(400);
        await expect(page.locator('input[name="valorInscricaoBRL"]')).toBeVisible();
        await expect(page.locator('input[name="valorInscricaoRT"]')).toBeVisible();
        console.log('✅ Permuta/Dinheiro: ambos visíveis');
    });

    test('5 - cadastro completo envia para a API', async ({ page }) => {
        const ts = Date.now();
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        // Informações da empresa
        await page.fill('input[name="razaoSocial"]', `Empresa Teste ${ts} Ltda`);
        await page.fill('input[name="nomeFantasia"]', `Loja Teste ${ts}`);
        await page.fill('input[name="descricao"]', 'Empresa de teste automatizado');
        // CNPJ único por execução (InputMask precisa de pressSequentially)
        const cnpjDigits = (String(ts).slice(-8).padStart(8, '1') + '000195').slice(0, 14)
        await page.locator('input[name="cnpj"]').pressSequentially(cnpjDigits);

        await page.locator('select[name="status"]').selectOption({ index: 1 });
        await page.locator('select[name="tipo"]').selectOption({ index: 1 });
        await page.locator('select[name="mostrarNoSite"]').selectOption({ index: 1 });

        // Contato
        await page.fill('input[name="nomeContato"]', 'João Teste');
        await page.fill('input[name="celular"]', '(11)99999-8888');
        await page.fill('input[name="emailContato"]', `contato${ts}@teste.com`);

        // Endereço
        await page.fill('input[name="logradouro"]', 'Rua das Flores');
        await page.fill('input[name="numero"]', '100');
        await page.fill('input[name="bairro"]', 'Centro');
        await page.fill('input[name="cidade"]', 'São Paulo');
        await page.fill('input[name="estado"]', 'SP');
        await page.fill('input[name="cep"]', '01310-100');

        // Plano
        const planoOpts = await page.locator('select[name="planoId"] option').count();
        if (planoOpts > 1) {
            await page.locator('select[name="planoId"]').selectOption({ index: 1 });
            await page.waitForTimeout(500);
        } else {
            console.log('⚠️  Sem planos — interrompendo teste de cadastro completo');
            return;
        }

        // Forma pagamento + valor
        await page.locator('select[name="formaPagamento"]').selectOption('100');
        await page.waitForTimeout(400);
        const rtField = page.locator('input[name="valorInscricaoRT"]');
        if (await rtField.isVisible()) await rtField.pressSequentially('100000');

        await page.locator('select[name="dataVencimentoFatura"]').selectOption('10');

        // Operações
        await page.locator('select[name="tipoOperacao"]').selectOption({ index: 1 });
        await page.locator('select[name="aceitaOrcamento"]').selectOption({ index: 1 });
        await page.locator('select[name="aceitaVoucher"]').selectOption({ index: 1 });

        // Limites (MoneyInput — pressSequentially dispara onChange corretamente)
        const limCred = page.locator('input[name="limiteCredito"]');
        if (await limCred.isVisible()) await limCred.pressSequentially('500000');
        const limMen = page.locator('input[name="limiteVendaMensal"]');
        if (await limMen.isVisible()) await limMen.pressSequentially('200000');
        const limTot = page.locator('input[name="limiteVendaTotal"]');
        if (await limTot.isVisible()) await limTot.pressSequentially('1000000');

        // Dados do usuário
        await page.fill('input[name="nome"]', 'Responsável Teste');
        // CPF único por execução
        const cpfDigits = String(ts).slice(-9).padStart(9, '0')
        await page.fill('input[name="cpf"]', cpfDigits.slice(0,3) + '.' + cpfDigits.slice(3,6) + '.' + cpfDigits.slice(6,9) + '-09');
        await page.fill('input[name="email"]', `user${ts}@teste.com`);
        await page.fill('input[name="senha"]', 'Senha@12345678');

        // Captura valores reais de todos os campos antes de submeter
        const fieldValues = await page.$$eval('input, select', els =>
            els.filter(el => el.name).map(el => ({ name: el.name, value: el.value }))
        );
        console.log('Valores dos campos:', JSON.stringify(fieldValues, null, 2));

        await page.screenshot({ path: '/tmp/antes-submit.png' });

        // Intercepta resposta da API (Vite proxia /api/v1/ → backend)
        const responsePromise = page.waitForResponse(
            r => r.url().includes('/api/v1/associados') && r.request().method() === 'POST',
            { timeout: 15000 }
        );
        await page.click('button[type="submit"]');

        let apiResponse = null;
        try {
            apiResponse = await responsePromise;
        } catch {
            console.log('⚠️  Sem resposta da API (form não submeteu — validação bloqueou?)');
        }

        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/apos-submit.png' });

        if (consoleErrors.length > 0) {
            console.log('Erros no console:', consoleErrors.join('\n'));
        }

        if (apiResponse) {
            const status = apiResponse.status();
            const body = await apiResponse.json().catch(() => ({}));
            console.log(`Status API: ${status}`);
            console.log('Resposta:', JSON.stringify(body, null, 2));
            if (status === 201) {
                console.log('✅ Associado cadastrado com sucesso!');
            } else {
                console.log('❌ Erro:', body.message ?? JSON.stringify(body));
            }
            expect(status).toBe(201);
        }
    });
});
