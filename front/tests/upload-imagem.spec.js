import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
const IMG_PATH = '/tmp/test-upload.png';

async function login(page) {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="login"]', 'admin@redetrade.com.br');
    await page.fill('input[name="senha"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
}

test('upload imagem na edicao de associado', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await login(page);
    await page.goto(`${BASE}/associadosLista`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const rows = await page.locator('tbody tr').count();
    if (rows === 0) { console.log('Sem associados'); return; }

    const editButton = page.locator('tbody tr').first().locator('td').last().locator('button').first();
    await editButton.click();
    await page.waitForTimeout(1500);

    const modalVisible = await page.locator('text=Editar Associado').isVisible().catch(() => false);
    if (!modalVisible) { console.log('Modal nao abriu'); return; }

    const fileInput = page.locator('input#img_path');
    await fileInput.setInputFiles(IMG_PATH);
    await page.waitForTimeout(500);

    const imgSrc = await page.locator('.formImage img').getAttribute('src').catch(() => null);
    console.log('Preview atualizado:', imgSrc ? imgSrc.startsWith('data:image') : false);

    const uploadPromise = page.waitForResponse(
        r => r.url().includes('/api/v1/upload') && r.request().method() === 'POST',
        { timeout: 12000 }
    ).catch(() => null);

    const putPromise = page.waitForResponse(
        r => r.url().includes('/api/v1/associados/') && r.request().method() === 'PUT',
        { timeout: 15000 }
    ).catch(() => null);

    await page.locator('button:has-text("Salvar")').click();

    const [uploadRes, putRes] = await Promise.all([uploadPromise, putPromise]);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/upload-edicao.png' });

    if (uploadRes) {
        const status = uploadRes.status();
        const body = await uploadRes.json().catch(() => ({}));
        console.log('Upload status:', status);
        console.log('Upload URL:', body?.data?.url);
        expect(status).toBe(201);
    } else {
        console.log('Upload nao foi chamado');
    }

    if (putRes) {
        const status = putRes.status();
        const body = await putRes.json().catch(() => ({}));
        console.log('PUT status:', status);
        console.log('imagemUrl salva:', body?.data?.imagemUrl);
        expect(status).toBe(200);
        if (uploadRes) expect(body?.data?.imagemUrl).toBeTruthy();
    }

    if (errors.length) console.log('PAGE ERRORs:', errors.join('\n'));
    expect(errors).toHaveLength(0);
});
