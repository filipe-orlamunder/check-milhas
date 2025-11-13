import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from '../validation';
import { prisma } from '../../prisma';
import { getRouteHandler, mockRes } from './_helpers';

describe('routes/validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /validation-dynamic retorna disponibilidades por perfil', async () => {
    vi.spyOn(prisma.profile, 'findMany').mockResolvedValueOnce([
      { id: 'p1', name: 'Perfil 1', cpf: '12345678901', beneficiaries: [] },
    ] as any);

    const handler = getRouteHandler(router as any, 'get', '/validation-dynamic');
    const req: any = { user: { id: 'u1' }, query: {} };
    const res = mockRes();

    await handler(req, res);
    expect(res.json).toHaveBeenCalled();
    const data = (res.json as any).mock.calls[0][0];
    expect(data[0].available).toEqual({ LATAM: 25, SMILES: 25, AZUL: 5 });
  });
});
