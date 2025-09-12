// src/components/dashboard/ProfileForm.tsx
import React, { useState } from 'react';
import { Profile } from '../../types';
import { X, Save } from 'lucide-react';

// Define as propriedades do componente
interface ProfileFormProps {
  onSubmit: (profile: Profile) => void;
  onCancel: () => void;
  userId: string;
  existingProfiles: Profile[]; // Lista de perfis existentes (não usada para validação local)
}

// Funções de validação e formatação
const onlyDigits = (s: string) => s.replace(/\D/g, ''); // Remove caracteres não numéricos
const validateName = (name: string) => {
  const l = name.trim().length;
  return l >= 4 && l <= 60;
};
const validateCPF = (cpf: string) => /^\d{11}$/.test(onlyDigits(cpf)); // Valida se o CPF tem 11 dígitos
const formatCPF = (cpf: string) => {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return cpf;
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4'); // Formata o CPF
};

// Componente do formulário para adicionar ou editar um perfil
export const ProfileForm: React.FC<ProfileFormProps> = ({
  onSubmit,
  onCancel,
  userId,
}) => {
  // Estados para gerenciar os campos do formulário e erros
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Valida todo o formulário antes de submeter
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validateName(name)) {
      newErrors.name = 'Nome deve ter entre 4 e 60 caracteres';
    }

    if (!validateCPF(cpf)) {
      newErrors.cpf = 'CPF deve conter 11 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verifica se os campos são válidos para habilitar o botão de salvar
  const isFormValid = validateName(name) && validateCPF(cpf);

  // Lida com a mudança no campo de CPF
  const handleCpfChange = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    setCpf(numbers);
  };

  // Lida com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const newProfile: Profile = {
        id: Date.now().toString(),
        name: name.trim(),
        cpf: onlyDigits(cpf),
        userId,
      };
      onSubmit(newProfile);
    }
  };

  // Estrutura do modal do formulário
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Adicionar novo perfil</h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de nome */}
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Digite o nome completo"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Campo de CPF */}
          <div>
            <label htmlFor="profile-cpf" className="block text-sm font-medium text-gray-700 mb-2">
              CPF
            </label>
            <input
              type="text"
              id="profile-cpf"
              value={formatCPF(cpf)}
              onChange={(e) => handleCpfChange(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                errors.cpf ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="000.000.000-00"
            />
            {errors.cpf && <p className="text-red-600 text-sm mt-1">{errors.cpf}</p>}
          </div>

          {/* Botões de ação */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                isFormValid
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-5 h-5" />
              <span>Salvar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
