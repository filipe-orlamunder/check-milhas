import { useEffect, useState } from "react";
import { User, Profile, Beneficiary, Screen } from "./types";
import { LoginForm } from "./components/auth/LoginForm";
import { SignupForm } from "./components/auth/SignupForm";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ProfileView } from "./components/dashboard/ProfileView";
import { ProgramScreen } from "./components/programs/ProgramScreen";
import { apiDelete, apiGet, apiPost, apiPut } from "./api";

/**
 * Hook customizado para gerenciar estado local com persistência no localStorage.
 */
function useLocalState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initialValue;

      // Tenta desserializar JSON ou usa valor bruto.
      try {
        return JSON.parse(raw) as T;
      } catch {
        return (raw as unknown) as T;
      }
    } catch {
      // Retorna o valor inicial em caso de erro ao acessar localStorage.
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (state === null) {
        // Remove o item se o estado for null (limpeza).
        localStorage.removeItem(key);
        return;
      }

      // Serializa valores primitivos como string.
      if (
        typeof state === "string" ||
        typeof state === "number" ||
        typeof state === "boolean"
      ) {
        localStorage.setItem(key, String(state));
        return;
      }

      // Serializa objetos/arrays como JSON.
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignora erros de escrita.
    }
  }, [key, state]);

  return [state, setState] as const;
}

/**
 * Componente principal da aplicação, responsável pelo estado global e roteamento.
 */
function App() {
  // Estado para gerenciamento de navegação e autenticação
  const [currentScreen, setCurrentScreen] = useLocalState<Screen>(
    "currentScreen",
    "login"
  );
  const [currentUser, setCurrentUser] = useLocalState<User | null>(
    "currentUser",
    null
  );
  const [token, setToken] = useLocalState<string | null>("token", null);

  // Estado para gerenciamento de dados da aplicação
  const [users, setUsers] = useLocalState<User[]>("users", []);
  const [profiles, setProfiles] = useLocalState<Profile[]>("profiles", []);
  const [beneficiaries, setBeneficiaries] = useLocalState<Beneficiary[]>(
    "beneficiaries",
    []
  );
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  // Helpers de mapeamento entre API (enums em CAIXA ALTA) e app (strings minúsculas/pt-BR)
  const toApiProgram = (p: Beneficiary["program"]) => p.toUpperCase() as "LATAM" | "SMILES" | "AZUL";
  const fromApiProgram = (p: string) => p.toLowerCase() as Beneficiary["program"];
  const fromApiStatus = (s: string) => {
    if (s === "UTILIZADO") return "Utilizado" as const;
    if (s === "LIBERADO") return "Liberado" as const;
    if (s === "PENDENTE") return "Pendente" as const;
    return "Utilizado" as const;
  };

  // Atualiza somente os beneficiários de um perfil+programa com o payload vindo da API
  const replaceBeneficiariesFor = (profileId: string, program: Beneficiary["program"], apiItems: any[]) => {
    setBeneficiaries((prev) => {
      const rest = prev.filter((b) => !(b.profileId === profileId && b.program === program));
      const mapped = apiItems.map((it) => ({
        id: it.id,
        profileId: it.profileId,
        program: fromApiProgram(it.program),
        name: it.name,
        cpf: it.cpf,
        issueDate: typeof it.issueDate === "string" ? it.issueDate : new Date(it.issueDate).toISOString().slice(0, 10),
        status: fromApiStatus(it.status),
        previousBeneficiary: it.previousName && it.previousCpf && it.previousDate
          ? { name: it.previousName, cpf: it.previousCpf, issueDate: (typeof it.previousDate === "string" ? it.previousDate : new Date(it.previousDate).toISOString().slice(0,10)) }
          : undefined,
        previousCpf: it.previousCpf ?? undefined,
        previousName: it.previousName ?? undefined,
        previousDate: it.previousDate ? (typeof it.previousDate === "string" ? it.previousDate : new Date(it.previousDate).toISOString().slice(0,10)) : undefined,
        changeDate: it.changeDate ? (typeof it.changeDate === "string" ? it.changeDate : new Date(it.changeDate).toISOString()) : undefined,
      })) as Beneficiary[];
      return [...rest, ...mapped];
    });
  };

  const refreshBeneficiaries = async (profileId: string, program: Beneficiary["program"]) => {
    try {
      const progApi = toApiProgram(program);
      const data = await apiGet<any[]>(`/profiles/${profileId}/beneficiaries?program=${progApi}`, token);
      replaceBeneficiariesFor(profileId, program, data);
    } catch (err: any) {
      console.error("Falha ao carregar beneficiários:", err);
    }
  };

  /**
   * Gerencia o login: define usuário, token e navega para o dashboard.
   */
  const handleLogin = (user: User, tokenFromServer?: string | null) => {
    if (tokenFromServer) {
      setToken(tokenFromServer);
    }
    // Adiciona o usuário à lista, se for novo.
    setUsers((prev) => {
      if (!prev.some((u) => u.email === user.email)) return [...prev, user];
      return prev;
    });
    setCurrentUser(user);
    setCurrentScreen("dashboard");
  };

  /**
   * Gerencia o logout: limpa dados de autenticação e volta para o login.
   */
  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setCurrentScreen("login");
  };

  /**
   * Gerencia o cadastro: define usuário, token e navega para o dashboard.
   */
  const handleSignup = (user: User, tokenFromServer?: string | null) => {
    if (tokenFromServer) {
      setToken(tokenFromServer);
    }
    setUsers((prev) => [...prev, user]);
    setCurrentUser(user);
    setCurrentScreen("dashboard");
  };

  /**
   * Adiciona um novo perfil à lista de perfis.
   */
  const handleAddProfile = (profile: Profile) => {
    setProfiles((prev) => [...prev, profile]);
  };

  /**
   * Remove um perfil e todos os beneficiários associados.
   */
  const handleDeleteProfile = async (profileId: string) => {
    try {
      // Remove no servidor primeiro
      await apiDelete(`/profiles/${profileId}`, token);

      // Só então atualiza o estado local
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      setBeneficiaries((prev) => prev.filter((b) => b.profileId !== profileId));
    } catch (err: any) {
      console.error("Falha ao excluir perfil no servidor:", err);
      alert(err?.body?.error ?? "Erro ao excluir perfil");
    }
  };

  /**
   * Adiciona um novo beneficiário à lista.
   */
  const handleAddBeneficiary = async (beneficiary: Beneficiary) => {
    try {
      const body = {
        program: toApiProgram(beneficiary.program),
        name: beneficiary.name,
        cpf: beneficiary.cpf,
        issueDate: beneficiary.issueDate,
      };
      await apiPost(`/profiles/${beneficiary.profileId}/beneficiaries`, body, token);
      await refreshBeneficiaries(beneficiary.profileId, beneficiary.program);
    } catch (err: any) {
      console.error("Falha ao criar beneficiário:", err);
      alert(err?.body?.error ?? "Erro ao criar beneficiário");
    }
  };

  /**
   * Remove um beneficiário específico por ID.
   */
  const handleDeleteBeneficiary = async (id: string) => {
    try {
      // Encontrar contexto para recarregar após remoção
      const target = beneficiaries.find((b) => b.id === id);
      await apiDelete(`/beneficiaries/${id}`, token);
      if (target) await refreshBeneficiaries(target.profileId, target.program);
      else setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      console.error("Falha ao excluir beneficiário:", err);
      alert(err?.body?.error ?? "Erro ao excluir beneficiário");
    }
  };

  /**
   * Remove todos os beneficiários de um perfil em um programa específico.
   */
  const handleDeleteAllBeneficiaries = async (
    profileId: string,
    program: "latam" | "smiles" | "azul"
  ) => {
    try {
      const progApi = toApiProgram(program);
      await apiDelete(`/profiles/${profileId}/beneficiaries?program=${progApi}`, token);
      await refreshBeneficiaries(profileId, program);
    } catch (err: any) {
      console.error("Falha ao excluir todos os beneficiários:", err);
      alert(err?.body?.error ?? "Erro ao excluir beneficiários");
    }
  };

  /**
   * Efeito para tratar a edição de beneficiário, incluindo lógica de substituição para 'azul'.
   */
  useEffect(() => {
    const onSubmitEdit = async (e: any) => {
      const ben: Beneficiary = e?.detail?.beneficiary;
      if (!ben) return;

      try {
        const existing = beneficiaries.find((b) => b.id === ben.id);
        const body: any = { name: ben.name, cpf: ben.cpf, issueDate: ben.issueDate };
        await apiPut(`/beneficiaries/${ben.id}`, body, token);
        // Após editar (inclui fluxo de TROCA Azul), recarrega a lista do programa
        const profId = existing?.profileId ?? ben.profileId;
        const prog = existing?.program ?? ben.program;
        await refreshBeneficiaries(profId, prog);
      } catch (err: any) {
        console.error("Falha ao editar beneficiário:", err);
        alert(err?.body?.error ?? "Erro ao editar beneficiário");
      }
    };

    window.addEventListener('submitEditBeneficiary', onSubmitEdit as EventListener);
    return () => window.removeEventListener('submitEditBeneficiary', onSubmitEdit as EventListener);
  }, [beneficiaries, token]);

  /**
   * Efeito para cancelar uma alteração pendente (regra do Azul).
   */
  useEffect(() => {
    const onCancel = async (e: any) => {
      const id: string = e?.detail?.id;
      if (!id) return;
      try {
        const target = beneficiaries.find((b) => b.id === id);
        await apiPost(`/beneficiaries/${id}/cancel-change`, {}, token);
        if (target) await refreshBeneficiaries(target.profileId, target.program);
      } catch (err: any) {
        console.error("Falha ao cancelar alteração:", err);
        alert(err?.body?.error ?? "Erro ao cancelar alteração");
      }
    };

    window.addEventListener('cancelChangeBeneficiary', onCancel as EventListener);
    return () => window.removeEventListener('cancelChangeBeneficiary', onCancel as EventListener);
  }, [beneficiaries, token]);

  /**
   * Finaliza automaticamente trocas pendentes da Azul após 30 dias.
   */
  useEffect(() => {
    setBeneficiaries((prev) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

    const dayMs = 24 * 60 * 60 * 1000;
    const pendingLimitDays = 30;
    const fallbackRemovalDays = 60;

      const parseDateOnly = (value?: string) => {
        if (!value) return null;
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
          const y = Number(match[1]);
          const m = Number(match[2]);
          const d = Number(match[3]);
          const local = new Date(y, m - 1, d);
          local.setHours(0, 0, 0, 0);
          return local;
        }
        const direct = new Date(value);
        if (!Number.isNaN(direct.getTime())) {
          direct.setHours(0, 0, 0, 0);
          return direct;
        }
        return null;
      };

      const removals = new Set<string>();
      const updates = new Map<string, Beneficiary>();
      let mutated = false;

      const groups = new Map<string, { changeDate: string; members: Beneficiary[] }>();

      for (const ben of prev) {
        if (ben.program === "azul" && ben.status === "Pendente" && ben.changeDate) {
          const key = `${ben.profileId}|${ben.changeDate}`;
          const entry = groups.get(key);
          if (entry) {
            entry.members.push(ben);
          } else {
            groups.set(key, { changeDate: ben.changeDate, members: [ben] });
          }
        }
      }

      for (const { changeDate, members } of groups.values()) {
        const newMember = members.find((member) => Boolean(member.previousCpf || member.previousBeneficiary));
        const baseDate = newMember
          ? parseDateOnly(newMember.issueDate)
          : parseDateOnly(changeDate) ?? parseDateOnly(members[0]?.issueDate);

        if (!baseDate) {
          continue;
        }

        const diffDays = Math.floor((today.getTime() - baseDate.getTime()) / dayMs);

        if (!newMember) {
          if (diffDays >= fallbackRemovalDays) {
            mutated = true;
            members.forEach((member) => removals.add(member.id));
          }
          continue;
        }

        if (diffDays < pendingLimitDays) continue;

        for (const member of members) {
          if (member.id === newMember.id) {
            mutated = true;
            const cleaned = {
              ...member,
              status: "Utilizado",
              changeDate: undefined,
              previousBeneficiary: undefined,
              previousCpf: undefined,
              previousName: undefined,
              previousDate: undefined,
            } as Beneficiary;
            updates.set(member.id, cleaned);
          } else {
            mutated = true;
            removals.add(member.id);
          }
        }
      }

      if (!mutated) return prev;

      return prev
        .filter((ben) => !removals.has(ben.id))
        .map((ben) => (updates.has(ben.id) ? updates.get(ben.id)! : ben));
    });
  }, [beneficiaries, setBeneficiaries]);

  // Ao entrar numa tela de programa com um perfil selecionado, carrega do backend
  useEffect(() => {
    const programScreens = ["latam", "smiles", "azul"] as const;
    if (selectedProfile && programScreens.includes(currentScreen as any)) {
      refreshBeneficiaries(selectedProfile.id, currentScreen as any);
    }
  }, [currentScreen, selectedProfile]);

  // --- RENDERIZAÇÃO E ROTEAMENTO ---

  if (currentUser) {
    // Roteamento para telas autenticadas
    if (currentScreen === "dashboard") {
      return (
        <Dashboard
          user={currentUser}
          profiles={profiles}
          beneficiaries={beneficiaries}
          onAddProfile={handleAddProfile}
          onDeleteProfile={handleDeleteProfile}
          onSelectProfile={(profile) => {
            setSelectedProfile(profile);
            setCurrentScreen("profile");
          }}
          onLogout={handleLogout}
        />
      );
    }

    if (currentScreen === "profile" && selectedProfile) {
      return (
        <ProfileView
          profile={selectedProfile}
          onBack={() => setCurrentScreen("dashboard")}
          onSelectProgram={(program) => setCurrentScreen(program)}
        />
      );
    }

    // Roteamento para as telas de programas de milhagem
    if (
      (currentScreen === "latam" ||
        currentScreen === "smiles" ||
        currentScreen === "azul") &&
      selectedProfile
    ) {
      return (
        <ProgramScreen
          program={currentScreen}
          profile={selectedProfile}
          beneficiaries={beneficiaries}
          onBack={() => setCurrentScreen("profile")}
          onAddBeneficiary={handleAddBeneficiary}
          onDeleteBeneficiary={handleDeleteBeneficiary}
          onDeleteAll={handleDeleteAllBeneficiaries}
        />
      );
    }
  }

  // Roteamento para telas de autenticação
  if (currentScreen === "signup") {
    return (
      <SignupForm
        onSignup={(user: User, t?: string | null) => handleSignup(user, t)}
        onSwitchToLogin={() => setCurrentScreen("login")}
        users={users}
      />
    );
  }

  // Tela padrão: Login
  return (
    <LoginForm
      onLogin={(user: User, t?: string | null) => handleLogin(user, t)}
      onSwitchToSignup={() => setCurrentScreen("signup")}
      users={users}
    />
  );
}

export default App;