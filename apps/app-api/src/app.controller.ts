import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';
import type { HealthResponse } from './app.service';

const HOME_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>App Boilerplate API</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    background: #f8fafc; color: #0f172a;
  }
  @media (prefers-color-scheme: dark) { body { background: #0b1120; color: #f1f5f9; } }
  .card { width: min(560px, 92vw); padding: 40px; }
  .badge {
    display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: #2563eb; border: 1px solid currentColor;
    border-radius: 999px; padding: 4px 10px; margin-bottom: 16px;
  }
  h1 { margin: 0 0 8px; font-size: 32px; }
  p { margin: 0 0 24px; color: #64748b; line-height: 1.6; }
  .links { display: flex; flex-wrap: wrap; gap: 12px; }
  a {
    display: inline-flex; align-items: center; height: 44px; padding: 0 20px;
    border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none;
  }
  a.primary { background: #2563eb; color: #fff; }
  a.secondary { border: 1px solid #cbd5e1; color: inherit; }
  code { background: rgba(100,116,139,0.18); padding: 1px 5px; border-radius: 4px; }
</style>
</head>
<body>
  <div class="card">
    <span class="badge">Boilerplate</span>
    <h1>App Boilerplate API</h1>
    <p>NestJS · GraphQL (Apollo) · MongoDB. Auth, multi-tenancy, notifications,
    push, mail and file uploads are wired up. Edit
    <code>src/app.controller.ts</code> to customize this page.</p>
    <div class="links">
      <a class="primary" href="/graphql">GraphQL Playground</a>
      <a class="secondary" href="/health">Health</a>
    </div>
  </div>
</body>
</html>`;

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html')
  getHome(): string {
    return HOME_HTML;
  }

  @Get('health')
  getHealthEndpoint(): HealthResponse {
    return this.appService.getHealth();
  }
}
