// src/components/dashboard/ProfileView.tsx
import React from 'react';
import { Profile } from '../../types';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '../common/Button';

// Define as propriedades de entrada do componente
interface ProfileViewProps {
  profile: Profile;
  onBack: () => void;
  onSelectProgram: (program: 'latam' | 'smiles' | 'azul') => void;
}

/**
 * Componente de visualização detalhada de um perfil específico.
 * Permite a navegação para os programas de fidelidade associados.
 */
export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onBack,
  onSelectProgram,
}) => {
  // Renderização da interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Cabeçalho da visualização de perfil */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Botão de retorno ao Dashboard */}
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-sm text-gray-600">Gerenciar programas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção principal: Cartões de Programas de Fidelidade */}
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* Cartão do programa LATAM Pass */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Latam Pass</h2>
            <p className="text-sm text-gray-600 mb-4">Gerencie beneficiários do programa de fidelidade LATAM Pass</p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => onSelectProgram('latam')}>Acessar</Button>
        </div>

        {/* Cartão do programa Smiles */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Smiles</h2>
            <p className="text-sm text-gray-600 mb-4">Gerencie beneficiários do programa de fidelidade Smiles</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => onSelectProgram('smiles')}>Acessar</Button>
        </div>

        {/* Cartão do programa Azul Fidelidade */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Azul Fidelidade</h2>
            <p className="text-sm text-gray-600 mb-4">Gerencie beneficiários do programa de fidelidade Azul Fidelidade</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onSelectProgram('azul')}>Acessar</Button>
        </div>
      </div>
    </div>
  );
};