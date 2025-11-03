import { describe, it, expect } from 'vitest';
import { errorHandler } from '../errorHandler';

function mockRes() {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code; return res;
  };
  res.json = (body: any) => {
    res.body = body; return res;
  };
  return res;
}

describe('middleware/errorHandler', () => {
  it('usa status customizado quando disponível', () => {
    const err = { status: 400, message: 'Falhou' };
    const res = mockRes();
    errorHandler(err as any, {} as any, res as any, {} as any);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Falhou' });
  });

  it('retorna 500 como fallback', () => {
    const err = new Error('boom');
    const res = mockRes();
    errorHandler(err as any, {} as any, res as any, {} as any);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Erro interno' });
  });
});
