// Tipos base da aplicação
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface Profile {
  id: string;
  name: string;
  cpf: string;
  userId: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  cpf: string;
  issueDate: string;
  status: 'Utilizado' | 'Liberado' | 'Pendente';
  profileId: string;
  program: 'latam' | 'smiles' | 'azul';
  previousBeneficiary?: { name: string; cpf: string; issueDate: string };
  previousCpf?: string;
  previousName?: string;
  previousDate?: string;
  changeDate?: string;
}

export type Screen = 'login' | 'signup' | 'dashboard' | 'profile' | 'latam' | 'smiles' | 'azul' | 'dynamic-validation';
