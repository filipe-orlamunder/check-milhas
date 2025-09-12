// src/programs/DynamicValidation.tsx
import React, { useState } from 'react';
import { Profile, Beneficiary } from '../../types';
import { X, Filter, Calendar, AlertTriangle } from 'lucide-react';

// Define as propriedades do componente
interface DynamicValidationProps {
  profiles: Profile[];
  beneficiaries: Beneficiary[];
  onClose: () => void;
}

/* Funções utilitárias para datas */
const getCurrentDate = () => new Date();

const formatDateForInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
/* --------------------------------------- */

// Componente para a validação dinâmica
export const DynamicValidation: React.FC<DynamicValidationProps> = ({
  profiles,
  beneficiaries,
  onClose,
}) => {
  const todayStr = formatDateForInput(getCurrentDate());

  // Estados para gerenciar a data do filtro e erros
  const [filterDate, setFilterDate] = useState(todayStr);
  const [appliedDate, setAppliedDate] = useState(todayStr);
  const [error, setError] = useState<string | null>(null);

  // Aplica o filtro de data
  const applyFilter = () => {
    setError(null);
    setAppliedDate(filterDate);
  };

  const selectedDate = new Date(appliedDate);

  // Calcula o número de beneficiários disponíveis por perfil e programa
  const getAvailableBeneficiaries = (
    profileId: string,
    program: 'latam' | 'smiles' | 'azul',
    _date: Date
  ) => {
    const profileBeneficiaries = beneficiaries.filter(
      (b) => b.profileId === profileId && b.program === program
    );

    // Retorna o saldo disponível com base no limite do programa
    if (program === 'latam') {
      return Math.max(0, 25 - profileBeneficiaries.length);
    }

    if (program === 'smiles') {
      return Math.max(0, 25 - profileBeneficiaries.length);
    }

    if (program === 'azul') {
      return Math.max(0, 5 - profileBeneficiaries.length);
    }

    return 0;
  };

  // Estrutura do modal de validação dinâmica
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Validação dinâmica</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Fechar">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controles de filtro */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Data de referência</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                pattern="\d{4}-\d{2}-\d{2}"
              />
            </div>
            {/* Botão para aplicar o filtro */}
            <button onClick={applyFilter} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Aplicar
            </button>
          </div>

          {/* Exibe mensagem de erro */}
          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Exibe a data de referência atual */}
          <p className="mt-3 text-sm text-gray-600">
            Informações buscadas com base na data <span className="font-medium">{appliedDate === todayStr ? 'ATUAL' : formatDate(appliedDate)}</span>
          </p>
        </div>

        {/* Lista de perfis e suas validações */}
        <div className="overflow-y-auto max-h-[60vh] p-6">
          {profiles.length === 0 ? (
            <p className="text-center text-gray-600">Nenhum perfil cadastrado</p>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold">{profile.name}</h3>
                <p className="text-sm text-gray-600 mb-4">CPF: {profile.cpf}</p>
                {/* Tabela de resultados por programa */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* LATAM Pass */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium">LATAM Pass</h4>
                    <p className="text-2xl text-red-600 font-bold">{getAvailableBeneficiaries(profile.id, 'latam', selectedDate)}</p>
                  </div>
                  {/* Smiles */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium">Smiles</h4>
                    <p className="text-2xl text-orange-600 font-bold">{getAvailableBeneficiaries(profile.id, 'smiles', selectedDate)}</p>
                  </div>
                  {/* Azul Fidelidade */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium">Azul Fidelidade</h4>
                    <p className="text-2xl text-blue-600 font-bold">{getAvailableBeneficiaries(profile.id, 'azul', selectedDate)}</p>
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
