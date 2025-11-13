import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks leves para evitar abrir porta e dependências externas
vi.mock('swagger-ui-express', () => ({ default: { serve: vi.fn(), setup: vi.fn() }, serve: vi.fn(), setup: vi.fn() }));
vi.mock('../routes/auth', () => ({ default: {} }));
vi.mock('../routes/profiles', () => ({ default: {} }));
vi.mock('../routes/beneficiaries', () => ({ default: {} }));
vi.mock('../routes/validation', () => ({ default: {} }));

describe('server/index smoke', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('inicializa o servidor e chama listen', async () => {
    const use = vi.fn();
    const listen = vi.fn((_port: any, cb: any) => { cb && cb(); });
    const expressMock: any = Object.assign(() => ({ use, listen }), {
      json: () => ((_req: any, _res: any, next: any) => next && next()),
    });

    vi.doMock('express', () => ({ default: expressMock }));
    vi.doMock('cors', () => ({ default: () => ({}), __esModule: true }));
    vi.doMock('dotenv/config', () => ({}));

    const mod = await import('../index');
    expect(mod).toBeTruthy();
    expect(listen).toHaveBeenCalled();
  });
});
