// src/components/programs/ProgramScreen.tsx
import React, { useState, useEffect } from "react";
import { onlyDigits, formatCPF } from "../../utils/formatters";
import { Beneficiary, Profile } from "../../types";
import { computeStatus } from "../../utils/statusCalculator";
import { ArrowLeft, Plus, Trash2, X, Users, Pencil, Repeat } from "lucide-react";
import { Button } from "../common/Button";

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
const validateName = (name: string) => {
  const l = name.trim().length;
  return l >= 4 && l <= 60;
};
const validateCPF = (cpf: string) => /^\d{11}$/.test(onlyDigits(cpf)); // Valida se o CPF tem 11 dígitos
// Parsea YYYY-MM-DD como data local para evitar deslocamentos por UTC
const parseDateOnlyToLocal = (input: string | Date | undefined): Date => {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  const m = (input as string).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return new Date(y, mo - 1, d);
  }
  return new Date(input as string);
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// sanitize input: limita ano a 4 dígitos e remove caracteres inválidos
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

const formatDate = (date: string) => {
  const d = parseDateOnlyToLocal(date);
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
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [editBeneficiary, setEditBeneficiary] = useState<Beneficiary | null>(null);
  const [exchangeMode, setExchangeMode] = useState(false);
  const [exchangePreviousCpf, setExchangePreviousCpf] = useState<string | null>(null);

  // ...existing code...

  // Filtra beneficiários do perfil e programa selecionados
  const programBeneficiaries = beneficiaries
    .filter((b: Beneficiary) => b.profileId === profile.id && b.program === program)
    .map((b: Beneficiary) => ({
      ...b,
      // Recalcula o status dinamicamente com base na data atual
      status: computeStatus(b.program, b.issueDate, (b as any).changeDate ?? null, new Date(), !!(b as any).previousCpf),
    }));

  // Estado para intervalo de atualização do contador de dias
  const [, setUpdateTick] = useState(0);

  // Atualiza o contador de dias restantes a cada hora
  useEffect(() => {
    const timer = setInterval(() => {
      setUpdateTick(t => t + 1);
    }, 1000 * 60 * 60); // Atualiza a cada hora
    return () => clearInterval(timer);
  }, []);

  // Lógica de limite de beneficiários
  let maxBeneficiaries = 25;
  let currentCount = programBeneficiaries.length;
  if (program === 'azul') {
    // Para Azul, durante trocas, dois pendentes contam como 1 (agrupar por changeDate)
    const pendentes = programBeneficiaries.filter((b: Beneficiary) => b.status === 'Pendente' && (b as any).changeDate);
    const groupKeys = new Set<string>(pendentes.map((b: any) => b.changeDate as string));
    const pendingGroups = groupKeys.size;
    const nonPendingCount = programBeneficiaries.length - pendentes.length;
    currentCount = nonPendingCount + pendingGroups;
    maxBeneficiaries = 5;
  }
  const canAddBeneficiary = currentCount < maxBeneficiaries;

  useEffect(() => {
    const onOpen = (e: any) => {
      const ben: Beneficiary | undefined = e?.detail?.beneficiary;
      if (ben) {
        setEditBeneficiary(ben);
        setExchangeMode(false);
        setExchangePreviousCpf(null);
        setShowModal(true);
      }
    };

    window.addEventListener('openEditBeneficiary', onOpen as EventListener);
    return () => window.removeEventListener('openEditBeneficiary', onOpen as EventListener);
  }, []);

  // Mapeamento de nomes de programas para exibição
  const programNames = {
    latam: "LATAM Pass",
    smiles: "Smiles",
    azul: "Azul Fidelidade",
  };

  // ...existing code...

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
            <Button
              onClick={() => setDeleteAllConfirm(true)}
              variant="danger"
              title="Excluir todos os beneficiários"
              className="text-sm flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir todos</span>
            </Button>
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
            disabled={!canAddBeneficiary}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              canAddBeneficiary
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
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
                    <p className="text-lg font-semibold text-gray-900">CPF: {formatCPF(b.cpf)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Botão para edição individual */}
                    <button
                      onClick={() => {
                        // abre modal de edição reutilizando o modal de adição (com prefill)
                        // usamos evento customizado no DOM para evitar alterar muitas props
                        const evt = new CustomEvent('openEditBeneficiary', { detail: { beneficiary: b } });
                        window.dispatchEvent(evt);
                      }}
                      disabled={b.status === 'Pendente'}
                      title={b.status === 'Pendente' ? 'Este beneficiário está em processo de alteração' : 'Editar beneficiário'}
                      className={`p-2 transition-colors rounded-lg ${
                        b.status === 'Pendente'
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <Pencil className="w-5 h-5" />
                    </button>

                    {/* Botão específico do Azul para iniciar a troca */}
                    {program === 'azul' && (
                      <button
                        onClick={() => {
                          // Abre o modal em modo 'troca'. Mantemos o initialValue para
                          // que a submissão seja tratada como edição (submitEditBeneficiary)
                          // porém os campos serão iniciados vazios no modal quando exchange=true.
                          setEditBeneficiary(b);
                          setExchangeMode(true);
                          setExchangePreviousCpf(b.cpf);
                          setShowModal(true);
                        }}
                        disabled={b.status === 'Pendente'}
                        title={b.status === 'Pendente' ? 'Este beneficiário está em processo de alteração' : 'Trocar beneficiário'}
                        className={`p-2 transition-colors rounded-lg ${
                          b.status === 'Pendente'
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <Repeat className="w-5 h-5" />
                      </button>
                    )}

                    {/* Botão para exclusão individual */}
                    <button
                      onClick={() => setDeleteConfirm(b.id)}
                      disabled={program === 'azul' && b.status === 'Pendente'}
                      title={program === 'azul' && b.status === 'Pendente' 
                        ? 'Não é possível excluir um beneficiário em processo de alteração'
                        : 'Excluir beneficiário'
                      }
                      className={`p-2 transition-colors rounded-lg ${
                        program === 'azul' && b.status === 'Pendente'
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Data de cadastro: {formatDate(b.issueDate)}
                </p>
                {/* Exibe o status do beneficiário */}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      Status:{' '}
                      <span
                        className={`font-semibold ${
                          b.status === 'Utilizado'
                            ? 'text-red-600'
                            : b.status === 'Pendente'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {b.status}
                      </span>
                    </p>
                    {program === 'azul' && b.status === 'Pendente' && (b as any).previousCpf && (
                      <p className="text-xs text-gray-600 mt-1">
                        {(() => {
                          // Cálculo correto dos dias restantes
                          const stripTime = (d: Date) => {
                            const x = new Date(d);
                            x.setHours(0, 0, 0, 0);
                            return x;
                          };
                          const issueDate = stripTime(parseDateOnlyToLocal(b.issueDate));
                          const today = stripTime(new Date());
                          const diffMs = today.getTime() - issueDate.getTime();
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          const daysLeft = Math.max(60 - diffDays, 0);
                          return `Troca em andamento — faltam ${daysLeft} dias para completar os 60 dias desde ${formatDate(b.issueDate)}`;
                        })()}
                      </p>
                    )}
                  </div>

                  {/* Se existe alteração pendente, mostrar botão para cancelar alteração */}
                  {b.status === 'Pendente' && (b as any).previousCpf && (
                    <Button
                      onClick={() => {
                        const evt = new CustomEvent('cancelChangeBeneficiary', { detail: { id: b.id } });
                        window.dispatchEvent(evt);
                      }}
                      variant="secondary"
                      className="text-xs"
                    >
                      Cancelar alteração
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Renderiza o modal de adição de beneficiário */}
      {showModal && (
        <AddBeneficiaryModal
          onClose={() => {
            setShowModal(false);
            setEditBeneficiary(null);
            setExchangeMode(false);
            setExchangePreviousCpf(null);
          }}
          onSubmit={(beneficiary, isEdit) => {
            if (isEdit) {
              // emitir evento customizado para App atualizar o beneficiary via callback global
              const evt = new CustomEvent('submitEditBeneficiary', { detail: { beneficiary } });
              window.dispatchEvent(evt);
            } else {
              onAddBeneficiary(beneficiary);
            }
            setShowModal(false);
            setEditBeneficiary(null);
            setExchangeMode(false);
            setExchangePreviousCpf(null);
          }}
          profileId={profile.id}
          program={program}
          initialValue={editBeneficiary ?? undefined}
          exchange={exchangeMode}
          previousCpf={exchangePreviousCpf ?? undefined}
          existingCpfs={programBeneficiaries.map((b) => b.cpf)}
        />
      )}

      {/* escuta evento para abrir modal de edição */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.addEventListener('openEditBeneficiary', function(e){ window.dispatchEvent(new CustomEvent('triggerOpenModal', {detail: e.detail})); });`,
        }}
      />

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
              <Button
                onClick={() => setDeleteConfirm(null)}
                variant="secondary"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  onDeleteBeneficiary(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                variant="danger"
                className="flex-1"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão em massa */}
      {deleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Exclusão em Massa
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir todos os beneficiários deste programa? Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setDeleteAllConfirm(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  onDeleteAll(profile.id, program);
                  setDeleteAllConfirm(false);
                }}
                variant="danger"
                className="flex-1"
              >
                Excluir Todos
              </Button>
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
  onSubmit: (beneficiary: Beneficiary, isEdit?: boolean) => void;
  profileId: string;
  program: "latam" | "smiles" | "azul";
  initialValue?: Beneficiary;
  // exchange: quando true, o modal funciona no fluxo de TROCA (Azul).
  // Nesse caso o modal será renderizado com campos vazios (para cadastrar
  // o novo beneficiário), mas a submissão continuará sendo enviada como
  // uma edição (isEdit=true) para que o App trate a substituição do Azul.
  exchange?: boolean;
  // CPF do beneficiário anterior — usado para evitar cadastrar o mesmo CPF
  // durante a troca.
  previousCpf?: string;
  // Lista de CPFs já cadastrados neste perfil+programa para validar duplicidade
  existingCpfs?: string[];
}

const AddBeneficiaryModal: React.FC<AddBeneficiaryModalProps> = ({
  onClose,
  onSubmit,
  profileId,
  program,
  initialValue,
  exchange = false,
  previousCpf,
  existingCpfs = [],
}) => {
  // Estados para gerenciar os campos do formulário e erros
  const [name, setName] = useState(exchange ? "" : initialValue?.name ?? "");
  const [cpf, setCpf] = useState(exchange ? "" : initialValue?.cpf ?? "");
  const [issueDate, setIssueDate] = useState(exchange ? "" : initialValue?.issueDate ?? "");
  const isEdit = !!initialValue;
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
    // Em modo de troca (Azul), não permitir cadastrar o mesmo CPF que estava
    // anteriormente cadastrado para o beneficiário alvo.
    if (exchange && previousCpf) {
      const cpfDigits = onlyDigits(cpf);
      const prevDigits = onlyDigits(previousCpf);
      if (cpfDigits === prevDigits) {
        newErrors.cpf = 'Não é possível cadastrar o mesmo CPF do beneficiário anterior durante a troca';
      }
    }
    if (!issueDate) {
      newErrors.issueDate = "Data é obrigatória";
    }
    // Não permitir data futura em nenhum programa
    if (issueDate) {
      // validar formato YYYY-MM-DD (ano 4 dígitos)
      if (!DATE_RE.test(issueDate)) {
        newErrors.issueDate = 'Formato de data inválido (YYYY-MM-DD)';
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const input = parseDateOnlyToLocal(issueDate);
        input.setHours(0, 0, 0, 0);
        if (input > today) {
          newErrors.issueDate = 'Data de cadastro não pode ser futura';
        }
        // Regras específicas de TROCA para Azul: quando estamos no modo de
        // exchange (troca) e há um beneficiário original (initialValue), não
        // é permitido informar uma data de emissão do novo beneficiário
        // anterior à data de emissão do beneficiário atual.
        if (exchange && isEdit && initialValue?.issueDate) {
          const original = parseDateOnlyToLocal(initialValue.issueDate);
          original.setHours(0, 0, 0, 0);
          const inputDate = parseDateOnlyToLocal(issueDate);
          inputDate.setHours(0, 0, 0, 0);
          if (inputDate < original) {
            newErrors.issueDate = 'Data de emissão do novo beneficiário não pode ser anterior à data do beneficiário atual';
          }
        }
      }
    }

    // Impede cadastrar CPF repetido no mesmo perfil/programa
    const digits = onlyDigits(cpf);
    const existsAlready = existingCpfs.some((c) => onlyDigits(c) === digits);
    const isEditingSameCpf = isEdit && onlyDigits(initialValue?.cpf || "") === digits;
    if (existsAlready && !isEditingSameCpf) {
      newErrors.cpf = "CPF já cadastrado";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verifica se o formulário é válido para habilitar o botão
  const isFormValid = validateName(name) && validateCPF(cpf) && !!issueDate && DATE_RE.test(issueDate);

  // Lida com a mudança no campo de CPF
  const handleCpfChange = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    setCpf(numbers);
  };

  // Lida com a submissão do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Calcula o status com base nas regras atuais (usa computeStatus)
      const computedStatus = computeStatus(
        program,
        issueDate,
        isEdit ? (initialValue as Beneficiary).changeDate ?? null : null,
        new Date(),
        Boolean(isEdit && (initialValue as Beneficiary).previousBeneficiary)
      );

      const newBeneficiary: Beneficiary = {
        id: isEdit ? (initialValue as Beneficiary).id : Date.now().toString(),
        name: name.trim(),
        cpf: onlyDigits(cpf),
        issueDate,
        status: computedStatus,
        profileId,
        program,
        previousBeneficiary: isEdit ? (initialValue as Beneficiary).previousBeneficiary : undefined,
        changeDate: isEdit ? (initialValue as Beneficiary).changeDate : undefined,
      };

      onSubmit(newBeneficiary, isEdit);
    }
  };

  // Estrutura do modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {exchange ? 'Trocar beneficiário' : 'Adicionar beneficiário'}
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
              onChange={(e) => setIssueDate(sanitizeDateInput(e.target.value))}
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
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid}
              variant="primary"
              className={`flex-1 flex items-center justify-center space-x-2 ${
                !isFormValid ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span>Salvar</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
