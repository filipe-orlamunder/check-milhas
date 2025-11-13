import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import router from '../auth';
import { prisma } from '../../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getRouteHandler, mockRes } from './_helpers';

describe('routes/auth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // default secret
    process.env.JWT_SECRET = 'secret';
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /register cria usuário e retorna token', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null as any);
    vi.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashed' as any);
    vi.spyOn(prisma.user, 'create').mockResolvedValueOnce({ id: 'u1', name: 'User', email: 'u@e.com' } as any);
    vi.spyOn(jwt, 'sign').mockReturnValueOnce('token' as any);

    const handler = getRouteHandler(router as any, 'post', '/register');
    const req: any = { body: { name: 'User Name', email: 'u@e.com', password: '123456' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ token: 'token', user: { id: 'u1', name: 'User', email: 'u@e.com' } });
  });

  it('POST /login autentica e retorna token', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({ id: 'u1', name: 'User', email: 'u@e.com', passwordHash: 'h' } as any);
    vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as any);
    vi.spyOn(jwt, 'sign').mockReturnValueOnce('token' as any);

    const handler = getRouteHandler(router as any, 'post', '/login');
    const req: any = { body: { email: 'u@e.com', password: '123' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: 'token', user: { id: 'u1', name: 'User', email: 'u@e.com' } });
  });
});
