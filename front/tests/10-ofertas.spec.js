import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
const API = 'http://localhost:3000/api/v1';

async function login(page) {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="login"]', 'admin@redetrade.com.br');
    await page.fill('input[name="senha"]', 'At2KnAH9GMFj90fHMBDVqArz');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
}

// Cria um associado dedicado via API para testar o fluxo de ofertas
// (cadastro de oferta exige role associate_admin/associate_operator).
async function criarAssociadoVendedor(request) {
    const loginRes = await request.post(`${API}/auth/login`, {
        data: { email: 'admin@redetrade.com.br', senha: 'At2KnAH9GMFj90fHMBDVqArz' },
    });
    const { data: { accessToken } } = await loginRes.json();

    const planosRes = await request.get(`${API}/planos`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { data: planos } = await planosRes.json();
    const planoId = planos.find((p) => p.tipoPlano === 'associado').id;

    const ts = Date.now();
    const email = `ofertas-vendedor-${ts}@teste.com`;
    await request.post(`${API}/associados`, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        data: {
            nome: `Vendedor Ofertas ${ts}`,
            cnpj: `44.555.${ts}`.slice(0, 18),
            email,
            planoId,
            tipoAtendimento: ['presencial'],
            cidade: 'Maceió',
            estado: 'AL',
            senha: 'SenhaForte@123',
        },
    });
    return email;
}

test.describe('Ofertas', () => {
    let vendedorEmail;

    test.beforeAll(async ({ playwright }) => {
        const request = await playwright.request.newContext();
        vendedorEmail = await criarAssociadoVendedor(request);
        await request.dispose();
    });

    test('1 - cadastro de oferta envia para a API corretamente', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${BASE}/login`);
        await page.waitForLoadState('networkidle');
        await page.fill('input[name="login"]', vendedorEmail);
        await page.fill('input[name="senha"]', 'SenhaForte@123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        await page.goto(`${BASE}/ofertasCadastrar`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const ts = Date.now();
        await page.fill('input[name="titulo"]', `Oferta Teste ${ts}`);
        await page.fill('textarea[name="descricao"]', 'Descrição de teste com mais de dez caracteres');

        const catOpts = await page.locator('select[name="categoriaId"] option').count();
        if (catOpts > 1) await page.locator('select[name="categoriaId"]').selectOption({ index: 1 });

        await page.locator('select[name="tipoAtendimento"]').selectOption(['presencial']);
        await page.fill('input[name="quantidadeDisponivel"]', '10');
        await page.locator('input[name="valorRT"]').pressSequentially('10000');
        await page.fill('input[name="cidade"]', 'Maceió');
        await page.fill('input[name="estado"]', 'AL');
        await page.fill('input[name="vencimento"]', '2027-01-01T00:00');

        const responsePromise = page.waitForResponse(
            (r) => r.url().includes('/api/v1/ofertas') && r.request().method() === 'POST',
            { timeout: 15000 },
        );
        await page.click('button[type="submit"]');
        const res = await responsePromise;
        const body = await res.json();

        expect(res.status()).toBe(201);
        expect(body.data.valorRT).not.toBe('0');
        expect(body.data.tipoAtendimento).toContain('presencial');
        expect(errors).toHaveLength(0);
    });

    test('2 - Minhas Ofertas lista a oferta cadastrada', async ({ page }) => {
        await page.goto(`${BASE}/login`);
        await page.waitForLoadState('networkidle');
        await page.fill('input[name="login"]', vendedorEmail);
        await page.fill('input[name="senha"]', 'SenhaForte@123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        await page.goto(`${BASE}/ofertasMinhas`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        const rows = await page.locator('tbody tr').count();
        expect(rows).toBeGreaterThan(0);
    });
});
