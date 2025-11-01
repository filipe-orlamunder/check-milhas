// src/programs/DynamicValidation.tsx
import React, { useState } from 'react';
import { formatCPF } from '../../utils/formatters';
import { Profile, Beneficiary } from '../../types';
import { X, Filter, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '../common/Button';
import { computeStatus } from '../../utils/statusCalculator';

// Definição das propriedades de entrada do componente
interface DynamicValidationProps {
  profiles: Profile[];
  beneficiaries: Beneficiary[];
  onClose: () => void;
}

// --- Utilitários de Data e Formatação ---

/** Retorna a data e hora atuais. */
const getCurrentDate = () => new Date();

/**
 * Formata um objeto Date para a string YYYY-MM-DD, compatível com input[type="date"].
 */
const formatDateForInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Converte string YYYY-MM-DD ou Date em objeto Date LOCAL (meia-noite local).
 * @param input String de data ou objeto Date.
 */
const parseDateOnlyToLocal = (input: string | Date | undefined): Date => {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    // Cria data local para evitar fuso horário
    return new Date(y, mo - 1, d);
  }
  return new Date(input);
};

/**
 * Formata uma string de data (YYYY-MM-DD) para DD/MM/YYYY.
 */
const formatDate = (dateStr: string) => {
  const d = parseDateOnlyToLocal(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// --- Componente Principal ---

/**
 * Modal que exibe o saldo de beneficiários disponíveis para cada perfil
 * e programa com base em uma data de referência.
 */
export const DynamicValidation: React.FC<DynamicValidationProps> = ({
  profiles,
  beneficiaries,
  onClose,
}) => {
  const todayStr = formatDateForInput(getCurrentDate());

  // Estados para gerenciar a data de input e a data de filtro aplicada
  const [filterDate, setFilterDate] = useState(todayStr);
  const [appliedDate, setAppliedDate] = useState(todayStr);
  const [error, setError] = useState<string | null>(null);

  // Regex para validação de formato YYYY-MM-DD
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  /**
   * Limpa e formata o input de data, limitando o comprimento.
   */
  const sanitizeDateInput = (v: string) => {
    if (!v) return v;
    const cleaned = v.replace(/[^0-9-]/g, '');
    const parts = cleaned.split('-');
    const y = (parts[0] || '').slice(0, 4);
    const m = (parts[1] || '').slice(0, 2);
    const d = (parts[2] || '').slice(0, 2);
    const out = [y, m, d].filter(Boolean).join('-');
    return out;
  };

  /**
   * Valida e aplica a data de filtro.
   */
  const applyFilter = () => {
    setError(null);
    if (!DATE_RE.test(filterDate)) {
      setError('Formato de data inválido. Use YYYY-MM-DD');
      return;
    }
    // Bloqueia datas passadas: permitir apenas hoje ou futuro
    if (filterDate < todayStr) {
      setError('Informe apenas a data atual ou uma data futura');
      return;
    }
    setAppliedDate(filterDate);
  };

  const selectedDate = parseDateOnlyToLocal(appliedDate);

  // Limites por programa
  const getProgramLimit = (program: 'latam' | 'smiles' | 'azul') => (program === 'azul' ? 5 : 25);

  // Filtra beneficiários por perfil e programa
  const getProfileProgramBeneficiaries = (profileId: string, program: 'latam' | 'smiles' | 'azul') =>
    beneficiaries.filter((b) => b.profileId === profileId && b.program === program);

  // Beneficiários que estarão "Liberado" na data informada (apenas Latam/Smiles)
  const getReleasedAtDate = (
    profileId: string,
    program: 'latam' | 'smiles' | 'azul',
    dateRef: Date
  ): Beneficiary[] => {
    if (program === 'azul') return [];
    return getProfileProgramBeneficiaries(profileId, program).filter((b) => {
      const statusAtDate = computeStatus(program, b.issueDate, b.changeDate ?? null, dateRef);
      return statusAtDate === 'Liberado';
    });
  };

  // Quantidade disponível na data: liberados (Latam/Smiles) + vagas até o limite. Azul: só vagas até o limite.
  const getAvailableCountAtDate = (
    profileId: string,
    program: 'latam' | 'smiles' | 'azul',
    dateRef: Date
  ) => {
    const limit = getProgramLimit(program);
    const all = getProfileProgramBeneficiaries(profileId, program);
    if (program === 'azul') {
      // Na Azul, durante uma troca, os dois pendentes contam como 1
      const pending = all.filter((b) => computeStatus('azul', b.issueDate, b.changeDate ?? null, dateRef) === 'Pendente' && !!b.changeDate);
      const groupKeys = new Set(pending.map((b) => b.changeDate as string));
      const pendingGroups = groupKeys.size;
      const nonPendingCount = all.length - pending.length;
      const effectiveRegistered = nonPendingCount + pendingGroups;
      const remaining = Math.max(0, limit - effectiveRegistered);
      return remaining; // Azul nunca libera
    }
    const registeredCount = all.length;
    const remainingSlots = Math.max(0, limit - registeredCount);
    const releasedCount = getReleasedAtDate(profileId, program, dateRef).length;
    return releasedCount + remainingSlots;
  };

  const getReleasedListForUI = (profileId: string, program: 'latam' | 'smiles' | 'azul') =>
    getReleasedAtDate(profileId, program, selectedDate);

  // Renderização do Modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Validação Dinâmica</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Fechar">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controles de Filtro */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Data de referência</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(sanitizeDateInput(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                pattern="\d{4}-\d{2}-\d{2}"
                min={todayStr}
              />
            </div>
            {/* Botão para aplicar filtro */}
            <Button onClick={applyFilter} variant="primary" className="px-6 py-3 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Aplicar
            </Button>
          </div>

          {/* Mensagem de erro de validação de data */}
          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Indicação da data de referência */}
          <p className="mt-3 text-sm text-gray-600">
            Informações buscadas com base na data <span className="font-medium">{appliedDate === todayStr ? 'ATUAL' : formatDate(appliedDate)}</span>
          </p>
        </div>

        {/* Resultados de Validação por Perfil */}
        <div className="overflow-y-auto max-h-[60vh] p-6">
          {profiles.length === 0 ? (
            <p className="text-center text-gray-600">Nenhum perfil cadastrado</p>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold">{profile.name}</h3>
                <p className="text-sm text-gray-600 mb-4">CPF: {formatCPF(profile.cpf)}</p>
                
                {/* Visualização de Saldo por Programa */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* LATAM Pass Saldo */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium">LATAM Pass</h4>
                      <p className="text-2xl text-red-600 font-bold">
                        {getAvailableCountAtDate(profile.id, 'latam', selectedDate)} <span className="text-base font-normal text-gray-700">beneficiários disponíveis</span>
                      </p>
                      {(() => {
                        const list = getReleasedListForUI(profile.id, 'latam');
                        return (
                          <div className="mt-2 text-sm text-gray-700">
                            {list.length > 0 ? (
                              <div>
                                <p className="font-medium mb-1">Liberados na data:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                  {list.map((b) => (
                                    <li key={b.id} className="break-words">
                                      {b.name} — CPF {formatCPF(b.cpf)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="text-gray-500">Nenhum beneficiário liberado nesta data.</p>
                            )}
                          </div>
                        );
                      })()}
                  </div>
                  {/* Smiles Saldo */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium">Smiles</h4>
                      <p className="text-2xl text-orange-600 font-bold">
                        {getAvailableCountAtDate(profile.id, 'smiles', selectedDate)} <span className="text-base font-normal text-gray-700">beneficiários disponíveis</span>
                      </p>
                      {(() => {
                        const list = getReleasedListForUI(profile.id, 'smiles');
                        return (
                          <div className="mt-2 text-sm text-gray-700">
                            {list.length > 0 ? (
                              <div>
                                <p className="font-medium mb-1">Liberados na data:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                  {list.map((b) => (
                                    <li key={b.id} className="break-words">
                                      {b.name} — CPF {formatCPF(b.cpf)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="text-gray-500">Nenhum beneficiário liberado nesta data.</p>
                            )}
                          </div>
                        );
                      })()}
                  </div>
                  {/* Azul Fidelidade Saldo */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium">Azul Fidelidade</h4>
                      <p className="text-2xl text-blue-600 font-bold">
                        {getAvailableCountAtDate(profile.id, 'azul', selectedDate)} <span className="text-base font-normal text-gray-700">beneficiários disponíveis</span>
                      </p>
                      <div className="mt-2 text-sm text-gray-700">
                        <p className="text-gray-500">Os beneficiários cadastrados não possuem data para liberações.</p>
                      </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};