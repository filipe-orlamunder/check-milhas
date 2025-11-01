export interface User {
  // Identificador único do usuário
  id: string;
  // Nome completo do usuário
  name: string;
  // Endereço de e-mail do usuário
  email: string;
  // Senha do usuário
  password: string;
}

export interface Profile {
  // Identificador único do perfil
  id: string;
  // Nome do perfil (geralmente nome completo)
  name: string;
  // CPF do perfil, usado para identificação
  cpf: string;
  // ID do usuário ao qual o perfil está associado
  userId: string;
}

export interface Beneficiary {
  // Identificador único do beneficiário
  id: string;
  // Nome do beneficiário
  name: string;
  // CPF do beneficiário
  cpf: string;
  // Data de cadastro do beneficiário
  issueDate: string;
  // Status atual do beneficiário no programa de fidelidade
  status: 'Utilizado' | 'Liberado' | 'Pendente';
  // ID do perfil ao qual o beneficiário pertence
  profileId: string;
  // Nome do programa de fidelidade (latam, smiles, azul)
  program: 'latam' | 'smiles' | 'azul';
  // Dados do beneficiário anterior (opcional)
  previousBeneficiary?: {
    name: string;
    cpf: string;
    issueDate: string;
  };
  // Campos auxiliares de controle de troca (Azul)
  previousCpf?: string;
  previousName?: string;
  previousDate?: string;
  // Data da última alteração de beneficiário (opcional)
  changeDate?: string;
}

// Tipo que define as telas da aplicação para navegação
export type Screen = 'login' | 'signup' | 'dashboard' | 'profile' | 'latam' | 'smiles' | 'azul' | 'dynamic-validation';
