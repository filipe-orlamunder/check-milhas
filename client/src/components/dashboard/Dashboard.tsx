// src/components/dashboard/Dashboard.tsx
import { useState } from 'react';
import { Profile, User, Beneficiary } from '../../types';
import { ProfileForm } from './ProfileForm';
import { Users, Plus, LogOut, Trash2, CheckCircle } from 'lucide-react';
import { DynamicValidation } from "../programs/DynamicValidation";
import { Button } from '../common/Button';

// Define as propriedades do componente
interface DashboardProps {
  user: User;
  profiles: Profile[];
  beneficiaries: Beneficiary[];
  onAddProfile: (profile: Profile) => void;
  onDeleteProfile: (profileId: string) => void;
  onSelectProfile: (profile: Profile) => void;
  onLogout: () => void;
}

// Componente principal do painel de controle
export const Dashboard: React.FC<DashboardProps> = ({
  user,
  profiles,
  beneficiaries,
  onAddProfile,
  onDeleteProfile,
  onSelectProfile,
  onLogout,
}) => {
  // Estados para controlar a exibição de modais e formulários
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Filtra os perfis do usuário atual
  const userProfiles = profiles.filter((p) => p.userId === user.id);
  // Verifica se o usuário pode adicionar mais perfis (limite de 10)
  const canAddProfile = userProfiles.length < 10;

  // Calcula as estatísticas de beneficiários por programa para um perfil
  const getProfileStats = (profileId: string) => {
    const profileBeneficiaries = beneficiaries.filter((b) => b.profileId === profileId);
    return {
      latam: profileBeneficiaries.filter((b) => b.program === 'latam').length,
      smiles: profileBeneficiaries.filter((b) => b.program === 'smiles').length,
      azul: profileBeneficiaries.filter((b) => b.program === 'azul').length,
    };
  };

  // Lida com a exclusão de um perfil
  const handleDeleteProfile = (profileId: string) => {
    onDeleteProfile(profileId);
    setDeleteConfirm(null);
  };
  
  // Estrutura da tela principal
  return (
    <>
      {/* Cabeçalho do dashboard */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tela Inicial</h1>
                <p className="text-sm text-gray-600">Olá, {user.name}</p>
              </div>
            </div>

            {/* Botão de sair */}
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Seção de gerenciamento de perfis */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gerenciamento de perfis</h2>
              <p className="text-gray-600">{userProfiles.length} de 10 perfis cadastrados</p>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
              {/* Botão para validação dinâmica */}
              <Button
                onClick={() => setShowValidation(true)}
                className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Validação Dinâmica</span>
              </Button>

              {/* Botão para adicionar perfil */}
              <Button
                onClick={() => setShowProfileForm(true)}
                disabled={!canAddProfile}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  canAddProfile
                    ?
                    'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>Adicionar perfil</span>
              </Button>
            </div>
          </div>

          {/* Exibe mensagem se não houver perfis ou a lista de perfis */}
          {userProfiles.length === 0 ?
            (
              <div className="text-center py-16">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum perfil cadastrado</h3>
                <p className="text-gray-600 mb-6">Comece adicionando seu primeiro perfil</p>
              </div>
            ) : (
              // Lista de perfis
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProfiles.map((profile) => {
                  const stats = getProfileStats(profile.id);
                  return (
                    <div
                      key={profile.id}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{profile.name}</h3>
                            <p className="text-gray-600 text-sm">CPF: {profile.cpf}</p>
                          </div>
                          {/* Botão de excluir perfil */}
                          <button
                            onClick={() => setDeleteConfirm(profile.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Estatísticas de beneficiários por programa */}
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">LATAM Pass</span>
                            <span className="text-sm font-medium text-gray-900">{stats.latam}/25</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Smiles</span>
                            <span className="text-sm font-medium text-gray-900">{stats.smiles}/25</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Azul Fidelidade</span>
                            <span className="text-sm font-medium text-gray-900">{stats.azul}/5</span>
                          </div>
                        </div>

                        {/* Botão para acessar o perfil */}
                        <button
                          onClick={() => onSelectProfile(profile)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          Acessar perfil
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      {/* Renderiza o formulário de perfil se o estado for verdadeiro */}
      {showProfileForm && (
        <ProfileForm
          onSubmit={(profile) => { onAddProfile(profile); setShowProfileForm(false); }}
          onCancel={() => setShowProfileForm(false)}
          userId={user.id}
          existingProfiles={userProfiles}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja excluir este perfil? Esta ação não poderá ser desfeita.</p>
            <div className="flex space-x-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={() => handleDeleteProfile(deleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de validação dinâmica */}
      {showValidation && (
        <DynamicValidation profiles={userProfiles} beneficiaries={beneficiaries} onClose={() => setShowValidation(false)} />
      )}
    </>
  );
};
