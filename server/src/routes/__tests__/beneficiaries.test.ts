import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from '../beneficiaries';
import * as service from '../../services/beneficiariesService';
import { prisma } from '../../prisma';
import { getRouteHandler, mockRes } from './_helpers';
import { Program, Status } from '@prisma/client';

vi.mock('../../utils/timezone', async (importOriginal) => {
  const actual: any = await importOriginal();
  const fixedNow = new Date('2025-03-01T10:00:00-03:00');
  return {
    ...actual,
    nowInBrazil: () => new Date(fixedNow),
    startOfDayBR: (d: Date) => { const dd = new Date(d); dd.setHours(0,0,0,0); return dd; },
    dateOnlyInBrazil: (s: string) => {
      const d = new Date(`${s}T00:00:00`);
      d.setHours(0,0,0,0);
      return d;
    },
  };
});

describe('routes/beneficiaries', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /profiles/:profileId/beneficiaries retorna lista com status computado', async () => {
    vi.spyOn(service, 'ensureProfileBelongsToUser').mockResolvedValueOnce({} as any);
    vi.spyOn(service, 'reconcileAzulPending').mockResolvedValueOnce();
    vi.spyOn(prisma.beneficiary, 'findMany').mockResolvedValueOnce([
      { id: 'b1', profileId: 'p1', program: 'LATAM', issueDate: new Date('2024-01-01'), changeDate: null, previousName: null, status: Status.UTILIZADO },
    ] as any);

    const handler = getRouteHandler(router as any, 'get', '/profiles/:profileId/beneficiaries');
    const req: any = { params: { profileId: 'p1' }, query: {}, user: { id: 'u1' } };
    const res = mockRes();

    await handler(req, res);
    expect(res.json).toHaveBeenCalled();
    const payload = (res.json as any).mock.calls[0][0];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload[0]).toMatchObject({ id: 'b1', program: 'LATAM' });
  });

  it('POST /profiles/:profileId/beneficiaries cria beneficiário válido', async () => {
    vi.spyOn(service, 'ensureProfileBelongsToUser').mockResolvedValueOnce({} as any);
    vi.spyOn(prisma.beneficiary, 'count').mockResolvedValue(0 as any);
    vi.spyOn(prisma.beneficiary, 'findFirst').mockResolvedValueOnce(null as any);
    vi.spyOn(prisma.beneficiary, 'create').mockResolvedValueOnce({ id: 'b1', profileId: 'p1', program: Program.LATAM } as any);

    const handler = getRouteHandler(router as any, 'post', '/profiles/:profileId/beneficiaries');
    const req: any = {
      params: { profileId: 'p1' },
      body: { program: 'LATAM', name: 'Joao da Silva', cpf: '12345678901', issueDate: '2024-10-10' },
      user: { id: 'u1' },
    };
    const res = mockRes();

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'b1', profileId: 'p1', program: Program.LATAM });
  });

  it('PUT /beneficiaries/:id (AZUL) sem mudanças retorna 400', async () => {
    vi.spyOn(prisma.beneficiary, 'findUnique').mockResolvedValueOnce({ id: 'b1', profileId: 'p1', program: 'AZUL', name: 'N', cpf: '12345678901', issueDate: new Date('2024-01-01') } as any);
    vi.spyOn(prisma.profile, 'findUnique').mockResolvedValueOnce({ id: 'p1', userId: 'u1' } as any);

    const handler = getRouteHandler(router as any, 'put', '/beneficiaries/:id');
    const req: any = { params: { id: 'b1' }, body: {}, user: { id: 'u1' } };
    const res = mockRes();

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
