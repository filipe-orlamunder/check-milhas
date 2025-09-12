// src/components/programs/ProgramScreen.tsx
import React, { useState } from "react";
import { Beneficiary, Profile } from "../../types";
import { ArrowLeft, Plus, Trash2, X, Save, Users } from "lucide-react";

// Define as propriedades do componente
interface ProgramScreenProps {
  program: "latam" | "smiles" | "azul";
  profile: Profile;
  beneficiaries: Beneficiary[];
  onBack: () => void;
  onAddBeneficiary: (beneficiary: Beneficiary) => void;
  onDeleteBeneficiary: (id: string) => void;
  onDeleteAll: (profileId: string, program: "latam" | "smiles" | "azul") => void;
}

// Funções utilitárias de validação e formatação
const onlyDigits = (s: string) => s.replace(/\D/g, ""); // Remove caracteres não numéricos
const validateName = (name: string) => {
  const l = name.trim().length;
  return l >= 4 && l <= 60;
};
const validateCPF = (cpf: string) => /^\d{11}$/.test(onlyDigits(cpf)); // Valida se o CPF tem 11 dígitos
const formatCPF = (cpf: string) => {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return cpf;
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4"); // Formata o CPF
};
const formatDate = (date: string) => {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`; // Formata a data para exibição
};

// Componente principal da tela de programas
export const ProgramScreen: React.FC<ProgramScreenProps> = ({
  program,
  profile,
  beneficiaries,
  onBack,
  onAddBeneficiary,
  onDeleteBeneficiary,
  onDeleteAll,
}) => {
  // Estados para controlar modais e confirmação de exclusão
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Mapeamento de nomes de programas para exibição
  const programNames = {
    latam: "LATAM Pass",
    smiles: "Smiles",
    azul: "Azul Fidelidade",
  };

  // Filtra beneficiários do perfil e programa selecionados
  const programBeneficiaries = beneficiaries.filter(
    (b) => b.profileId === profile.id && b.program === program
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Cabeçalho */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Botão de voltar */}
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {programNames[program]}
              </h1>
              <p className="text-sm text-gray-600">
                Beneficiários de {profile.name}
              </p>
            </div>
          </div>

          {/* Botão para excluir todos os beneficiários do programa */}
          {programBeneficiaries.length > 0 && (
            <button
              onClick={() => onDeleteAll(profile.id, program)}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 flex items-center space-x-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir todos</span>
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Gerenciamento de beneficiários
          </h2>
          {/* Botão para adicionar beneficiário */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>Adicionar beneficiário</span>
          </button>
        </div>

        {/* Exibe mensagem se não houver beneficiários ou a lista */}
        {programBeneficiaries.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum beneficiário cadastrado
            </h3>
            <p className="text-gray-600 mb-6">
              Comece adicionando o primeiro beneficiário
            </p>
          </div>
        ) : (
          // Lista de beneficiários
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programBeneficiaries.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {b.name}
                    </h3>
                    <p className="text-sm text-gray-600">CPF: {b.cpf}</p>
                  </div>
                  {/* Botão para exclusão individual */}
                  <button
                    onClick={() => setDeleteConfirm(b.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Data de cadastro: {formatDate(b.issueDate)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Renderiza o modal de adição de beneficiário */}
      {showModal && (
        <AddBeneficiaryModal
          onClose={() => setShowModal(false)}
          onSubmit={(beneficiary) => {
            onAddBeneficiary(beneficiary);
            setShowModal(false);
          }}
          profileId={profile.id}
          program={program}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este beneficiário?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteBeneficiary(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente do modal para adicionar um beneficiário
interface AddBeneficiaryModalProps {
  onClose: () => void;
  onSubmit: (beneficiary: Beneficiary) => void;
  profileId: string;
  program: "latam" | "smiles" | "azul";
}

const AddBeneficiaryModal: React.FC<AddBeneficiaryModalProps> = ({
  onClose,
  onSubmit,
  profileId,
  program,
}) => {
  // Estados para gerenciar os campos do formulário e erros
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Valida o formulário antes da submissão
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validateName(name)) {
      newErrors.name = "Nome deve ter entre 4 e 60 caracteres";
    }
    if (!validateCPF(cpf)) {
      newErrors.cpf = "CPF deve conter 11 dígitos";
    }
    if (!issueDate) {
      newErrors.issueDate = "Data é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verifica se o formulário é válido para habilitar o botão
  const isFormValid = validateName(name) && validateCPF(cpf) && !!issueDate;

  // Lida com a mudança no campo de CPF
  const handleCpfChange = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    setCpf(numbers);
  };

  // Lida com a submissão do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const newBeneficiary: Beneficiary = {
        id: Date.now().toString(),
        name: name.trim(),
        cpf: onlyDigits(cpf),
        issueDate,
        status: "Liberado",
        profileId,
        program,
      };
      onSubmit(newBeneficiary);
    }
  };

  // Estrutura do modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Adicionar beneficiário
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de nome */}
          <div>
            <label
              htmlFor="beneficiary-name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nome Completo
            </label>
            <input
              type="text"
              id="beneficiary-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                errors.name
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Digite o nome completo"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Campo de CPF */}
          <div>
            <label
              htmlFor="beneficiary-cpf"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              CPF
            </label>
            <input
              type="text"
              id="beneficiary-cpf"
              value={formatCPF(cpf)}
              onChange={(e) => handleCpfChange(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                errors.cpf
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="000.000.000-00"
            />
            {errors.cpf && (
              <p className="text-red-600 text-sm mt-1">{errors.cpf}</p>
            )}
          </div>

          {/* Campo de data */}
          <div>
            <label
              htmlFor="beneficiary-date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Data de Cadastro
            </label>
            <input
              type="date"
              id="beneficiary-date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                errors.issueDate
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {errors.issueDate && (
              <p className="text-red-600 text-sm mt-1">{errors.issueDate}</p>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                isFormValid
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
