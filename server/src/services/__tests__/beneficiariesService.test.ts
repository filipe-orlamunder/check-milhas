import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../prisma';
import { ensureProfileBelongsToUser, reconcileAzulPending } from '../beneficiariesService';
import { Status } from '@prisma/client';

vi.mock('../../utils/timezone', () => {
  const fixedNow = new Date('2025-03-01T10:00:00-03:00');
  return {
    nowInBrazil: () => new Date(fixedNow),
    startOfDayBR: (d: Date) => {
      const dd = new Date(d);
      dd.setHours(0, 0, 0, 0);
      return dd;
    },
  };
});

describe('services/beneficiariesService.ensureProfileBelongsToUser', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lança 404 quando perfil não existe', async () => {
    vi.spyOn(prisma.profile, 'findUnique').mockResolvedValueOnce(null as any);
    await expect(ensureProfileBelongsToUser('p1', 'u1')).rejects.toMatchObject({ status: 404 });
  });

  it('lança 403 quando usuário não é dono do perfil', async () => {
    vi.spyOn(prisma.profile, 'findUnique').mockResolvedValueOnce({ id: 'p1', userId: 'u2' } as any);
    await expect(ensureProfileBelongsToUser('p1', 'u1')).rejects.toMatchObject({ status: 403 });
  });

  it('retorna o perfil quando pertence ao usuário', async () => {
    const profile = { id: 'p1', userId: 'u1' } as any;
    vi.spyOn(prisma.profile, 'findUnique').mockResolvedValueOnce(profile);
    const res = await ensureProfileBelongsToUser('p1', 'u1');
    expect(res).toBe(profile);
  });
});

describe('services/beneficiariesService.reconcileAzulPending', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('finaliza trocas após 30 dias, removendo antigo e consolidando novo', async () => {
    const pendingNew = [{
      id: 'new1',
      profileId: 'p1',
      program: 'AZUL',
      status: 'PENDENTE',
      issueDate: new Date('2025-01-01T00:00:00-03:00'),
      previousCpf: '11111111111',
      changeDate: new Date('2025-01-15T10:00:00-03:00'),
    }];

    const orphanOld: any[] = [];

    const findManySpy = vi
      .spyOn(prisma.beneficiary, 'findMany')
      .mockResolvedValueOnce(pendingNew as any)
      .mockResolvedValueOnce(orphanOld as any);

    const findFirstSpy = vi
      .spyOn(prisma.beneficiary, 'findFirst')
      .mockResolvedValueOnce({ id: 'old1' } as any);

    const deleteSpy = vi.spyOn(prisma.beneficiary, 'delete').mockResolvedValue({} as any);
    const updateSpy = vi.spyOn(prisma.beneficiary, 'update').mockResolvedValue({ id: 'new1', status: Status.UTILIZADO } as any);

    await reconcileAzulPending();

    expect(findManySpy).toHaveBeenCalledTimes(2);
    expect(findFirstSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 'old1' } });
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'new1' },
      data: {
        status: Status.UTILIZADO,
        changeDate: null,
        previousName: null,
        previousCpf: null,
        previousDate: null,
      },
    });
  });

  it('remove antigos órfãos após 30 dias', async () => {
    const pendingNew: any[] = [];
    const orphanOld = [{
      id: 'old-orphan',
      profileId: 'p1',
      program: 'AZUL',
      status: 'PENDENTE',
      previousCpf: null,
      previousName: null,
      changeDate: new Date('2025-01-15T00:00:00-03:00'),
    }];

    const findManySpy = vi
      .spyOn(prisma.beneficiary, 'findMany')
      .mockResolvedValueOnce(pendingNew as any)
      .mockResolvedValueOnce(orphanOld as any);

    const deleteSpy = vi.spyOn(prisma.beneficiary, 'delete').mockResolvedValue({} as any);

    await reconcileAzulPending();

    expect(findManySpy).toHaveBeenCalledTimes(2);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 'old-orphan' } });
  });
});
