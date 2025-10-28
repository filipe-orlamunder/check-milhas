// client/src/components/dashboard/ProfileForm.tsx
import React, { useState } from "react";
import { Profile } from "../../types";
import { X, Save } from "lucide-react";
import { apiPost } from "../../api";
import { Button } from "../common/Button";

// Definição das propriedades do componente
interface ProfileFormProps {
  onSubmit: (profile: Profile) => void;
  onCancel: () => void;
  userId: string;
  existingProfiles: Profile[];
}

// --- Funções de Utilitário e Validação ---

/**
 * Remove todos os caracteres não numéricos de uma string.
 */
const onlyDigits = (s: string) => s.replace(/\D/g, "");

/**
 * Valida o comprimento do nome.
 */
const validateName = (name: string) => {
  const l = name.trim().length;
  return l >= 4 && l <= 60;
};

/**
 * Valida se o CPF contém exatamente 11 dígitos numéricos.
 */
const validateCPF = (cpf: string) => /^\d{11}$/.test(onlyDigits(cpf));

/**
 * Formata o CPF no padrão XXX.XXX.XXX-XX.
 */
const formatCPF = (cpf: string) => {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return cpf;
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
};

// --- Componente ProfileForm ---

/**
 * Formulário modal para criar um novo perfil de usuário.
 */
export const ProfileForm: React.FC<ProfileFormProps> = ({
  onSubmit,
  onCancel,
  userId,
}) => {
  // Estados do formulário
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  /**
   * Executa a validação local dos campos do formulário.
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!validateName(name)) newErrors.name = "Nome deve ter entre 4 e 60 caracteres";
    if (!validateCPF(cpf)) newErrors.cpf = "CPF deve conter 11 dígitos";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Determina se o formulário está sintaticamente válido para submissão
  const isFormValid = validateName(name) && validateCPF(cpf);

  /**
   * Lida com a entrada de CPF, limitando a 11 dígitos e removendo formatação.
   */
  const handleCpfChange = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    setCpf(numbers);
  };

  /**
   * Handler de submissão: valida, chama a API e trata a resposta.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Chamada à API para criação de perfil
      const resp = await apiPost("/profiles", { name: name.trim(), cpf: cpf }, token);
      onSubmit(resp); // Retorna o perfil criado
    } catch (err: any) {
      setServerError(err?.body?.error ?? "Erro ao criar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Modal container
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Adicionar novo perfil</h2>
          <Button onClick={onCancel} variant="secondary" className="p-2">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo Nome Completo */}
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
                errors.name ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Digite o nome completo"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Campo CPF */}
          <div>
            <label htmlFor="profile-cpf" className="block text-sm font-medium text-gray-700 mb-2">
              CPF
            </label>
            <input
              type="text"
              id="profile-cpf"
              value={formatCPF(cpf)} // Exibe o CPF formatado
              onChange={(e) => handleCpfChange(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                errors.cpf ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="000.000.000-00"
            />
            {errors.cpf && <p className="text-red-600 text-sm mt-1">{errors.cpf}</p>}
          </div>

          {serverError && <p className="text-red-600 text-sm">{serverError}</p>}

          {/* Botões de Ação */}
          <div className="flex space-x-3">
            <Button type="button" onClick={onCancel} variant="secondary" className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid || loading} 
              variant="primary"
              className={`flex-1 ${!isFormValid || loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};