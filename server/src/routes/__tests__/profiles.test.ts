import { describe, it, expect, vi, beforeEach } from 'vitest';
import profilesRouter from '../profiles';
import { prisma } from '../../prisma';
import { getRouteHandler, mockRes } from './_helpers';

describe('routes/profiles', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /profiles retorna perfis do usuário', async () => {
    vi.spyOn(prisma.profile, 'findMany').mockResolvedValueOnce([{ id: 'p1' }] as any);

    const handler = getRouteHandler(profilesRouter as any, 'get', '/profiles');
    const req: any = { user: { id: 'u1' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith([{ id: 'p1' }]);
  });

  it('POST /profiles cria perfil quando payload válido', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({ id: 'u1' } as any);
    vi.spyOn(prisma.profile, 'findFirst').mockResolvedValueOnce(null as any);
    vi.spyOn(prisma.profile, 'create').mockResolvedValueOnce({ id: 'p1', name: 'Perfil', cpf: '12345678901' } as any);

    const handler = getRouteHandler(profilesRouter as any, 'post', '/profiles');
    const req: any = { user: { id: 'u1' }, body: { name: 'Perfil', cpf: '12345678901' } };
    const res = mockRes();

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'p1', name: 'Perfil', cpf: '12345678901' });
  });

  it('DELETE /profiles/:id exclui quando pertence ao usuário', async () => {
    vi.spyOn(prisma.profile, 'findFirst').mockResolvedValueOnce({ id: 'p1', userId: 'u1' } as any);
    vi.spyOn(prisma.profile, 'delete').mockResolvedValueOnce({} as any);

    const handler = getRouteHandler(profilesRouter as any, 'delete', '/profiles/:id');
    const req: any = { user: { id: 'u1' }, params: { id: 'p1' } };
    const res = mockRes();

    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Perfil excluído com sucesso.' });
  });
});
