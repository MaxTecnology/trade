import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 30000,
    // Specs compartilham estado no banco (ex: associado criado em 02- é usado por 03-06) —
    // execução sequencial e em ordem de arquivo é necessária.
    fullyParallel: false,
    workers: 1,
    use: {
        baseURL: 'http://localhost:5173',
        headless: true,
        viewport: { width: 1280, height: 900 },
        ignoreHTTPSErrors: true,
    },
    reporter: [['list']],
});
