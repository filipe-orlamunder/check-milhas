import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { authMiddleware, type AuthRequest } from '../authMiddleware';
import jwt from 'jsonwebtoken';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('middleware/authMiddleware', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...OLD_ENV, JWT_SECRET: 'secret' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('retorna 401 quando não há Bearer token', () => {
    const req = { headers: {} } as unknown as AuthRequest;
    const res = mockRes();
    const next = vi.fn();

    authMiddleware(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token não fornecido.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('aceita token válido e injeta req.user', () => {
    const token = 'token';
    vi.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-1' } as any);

    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as AuthRequest;
    const res = mockRes();
    const next = vi.fn();

    authMiddleware(req, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 'user-1' });
  });

  it('retorna 401 quando verify lança erro', () => {
    const token = 'token';
    vi.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('bad');
    });

    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as AuthRequest;
    const res = mockRes();
    const next = vi.fn();

    authMiddleware(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido ou expirado.' });
    expect(next).not.toHaveBeenCalled();
  });
});
