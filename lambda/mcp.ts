import type { Server } from 'npm:@modelcontextprotocol/sdk@1.17.4/server/index.js';
import { createConnection } from 'npm:@playwright/mcp';

export async function createMCPServer(): Promise<Server> {
  return await createConnection({
    browser: {
      browserName: 'chromium',
      isolated: true, // メモリ内でプロファイルを管理
      launchOptions: {
        headless: true,
        timeout: 30000, // 30秒のタイムアウト
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process', // Lambda最適化
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-web-security',
          '--disable-blink-features=AutomationControlled',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--use-gl=swiftshader',
          '--window-size=1920,1080',
          // メモリ最適化
          '--disable-dev-tools',
          '--disable-extensions',
          '--disable-component-extensions-with-background-pages',
        ],
      },
      // contextOptionsは初期ストレージ状態を設定する際に使用
      contextOptions: {},
    },
    capabilities: ['core', 'core-tabs'], // 基本機能のみ有効化
  });
}
