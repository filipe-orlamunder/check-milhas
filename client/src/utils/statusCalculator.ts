export type Program = "latam" | "smiles" | "azul";
export type Status = "Utilizado" | "Liberado" | "Pendente";

// refDate default para hoje (sem hora)
const stripTime = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export function computeStatus(
  program: Program,
  issueDateStr: string,
  changeDateStr?: string | null,
  refDate: Date = new Date(),
  isNewForAzul: boolean = false
): Status {
  const issueDate = stripTime(new Date(issueDateStr));
  const ref = stripTime(refDate);
  const changeDate = changeDateStr ? stripTime(new Date(changeDateStr)) : null;

  if (program === "latam") {
    const oneYear = new Date(issueDate);
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    return ref < oneYear ? "Utilizado" : "Liberado";
  }

  if (program === "smiles") {
    // Se a emissão foi em ano anterior ao ano de referência, já está liberado
    if (issueDate.getFullYear() < ref.getFullYear()) return "Liberado";
    const resetDate = new Date(issueDate.getFullYear() + 1, 0, 1);
    return ref < resetDate ? "Utilizado" : "Liberado";
  }

  if (program === "azul") {
    if (changeDate) {
      const finish = new Date(changeDate);
      finish.setDate(finish.getDate() + 60); // 60 dias
      if (ref < finish) return "Pendente";
      return isNewForAzul ? "Utilizado" : "Liberado";
    }
    return "Utilizado";
  }

  return "Utilizado";
}

export function daysRemainingForAzul(changeDateStr: string | null): number {
  if (!changeDateStr) return 0;
  const changeDate = stripTime(new Date(changeDateStr));
  const finish = new Date(changeDate);
  finish.setDate(finish.getDate() + 60);
  const today = stripTime(new Date());
  const diffMs = finish.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
