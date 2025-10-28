export type Program = "latam" | "smiles" | "azul";
export type Status = "Utilizado" | "Liberado" | "Pendente";

// Remove a informação de hora (time) de um objeto Date para comparações diárias
const stripTime = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// Converte a string 'YYYY-MM-DD' para objeto Date, tratando-a como data local
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

// Calcula o status do beneficiário com base nas regras do programa e datas
export function computeStatus(
  program: Program,
  issueDateStr: string,
  changeDateStr?: string | null,
  refDate: Date = new Date(),
  isNewForAzul: boolean = false
): Status {
  // Normaliza todas as datas para comparação diária
  const issueDate = stripTime(parseDateOnlyToLocal(issueDateStr));
  const ref = stripTime(refDate);
  const changeDate = changeDateStr ? stripTime(parseDateOnlyToLocal(changeDateStr)) : null;

  // Regra LATAM: status muda de 'Utilizado' para 'Liberado' após 1 ano da data de emissão
  if (program === "latam") {
    const oneYear = new Date(issueDate);
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    return ref < oneYear ? "Utilizado" : "Liberado";
  }

  // Regra SMILES: status muda de 'Utilizado' para 'Liberado' a partir de 1º de Janeiro do ano seguinte
  if (program === "smiles") {
    // Se a data de emissão for em ano anterior ao ano de referência, está liberado
    if (issueDate.getFullYear() < ref.getFullYear()) return "Liberado";
    const resetDate = new Date(issueDate.getFullYear() + 1, 0, 1);
    return ref < resetDate ? "Utilizado" : "Liberado";
  }

  // Regra AZUL: 60 dias de quarentena após alteração (changeDate)
  if (program === "azul") {
    if (changeDate) {
      const finish = new Date(changeDate);
      finish.setDate(finish.getDate() + 60); // Quarentena de 60 dias
      // Verifica se a quarentena está em andamento
      if (ref < finish) return "Pendente"; 
      // Após a quarentena, 'Utilizado' (se novo) ou 'Liberado' (se substituição)
      return isNewForAzul ? "Utilizado" : "Liberado";
    }
    // Sem data de alteração, status padrão para Azul é "Utilizado"
    return "Utilizado";
  }

  // Retorno padrão
  return "Utilizado";
}

// Calcula os dias restantes para o término da quarentena da Azul (60 dias)
export function daysRemainingForAzul(changeDateStr: string | null): number {
  if (!changeDateStr) return 0;
  const changeDate = stripTime(new Date(changeDateStr));
  const finish = new Date(changeDate);
  finish.setDate(finish.getDate() + 60);
  const today = stripTime(new Date());
  // Calcula a diferença em milissegundos e converte para dias, arredondando para cima
  const diffMs = finish.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}