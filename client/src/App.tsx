import { useEffect, useState } from "react";
import { User, Profile, Beneficiary, Screen } from "./types";
import { LoginForm } from "./components/auth/LoginForm";
import { SignupForm } from "./components/auth/SignupForm";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ProfileView } from "./components/dashboard/ProfileView";
import { ProgramScreen } from "./components/programs/ProgramScreen";
import { apiDelete } from "./api";

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
  const handleAddBeneficiary = (beneficiary: Beneficiary) => {
    setBeneficiaries((prev) => [...prev, beneficiary]);
  };

  /**
   * Remove um beneficiário específico por ID.
   */
  const handleDeleteBeneficiary = (id: string) => {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
  };

  /**
   * Remove todos os beneficiários de um perfil em um programa específico.
   */
  const handleDeleteAllBeneficiaries = (
    profileId: string,
    program: "latam" | "smiles" | "azul"
  ) => {
    setBeneficiaries((prev) =>
      prev.filter((b) => !(b.profileId === profileId && b.program === program))
    );
  };

  /**
   * Efeito para tratar a edição de beneficiário, incluindo lógica de substituição para 'azul'.
   */
  useEffect(() => {
    const onSubmitEdit = (e: any) => {
      const ben: Beneficiary = e?.detail?.beneficiary;
      if (!ben) return;

      setBeneficiaries((prev) => {
        // Lógica de substituição específica para o programa Azul
        if (ben.program === 'azul') {
          const idx = prev.findIndex((b) => b.id === ben.id);
          if (idx !== -1) {
            const updated = [...prev];
            const existing = updated[idx];
            // Se o CPF for alterado, inicia a substituição pendente
            if (existing.cpf !== ben.cpf) {
              const nowIso = new Date().toISOString();
              // O beneficiário anterior se torna 'Pendente'
              updated[idx] = { ...existing, status: 'Pendente', changeDate: nowIso } as Beneficiary;
              // Adiciona o novo beneficiário também como 'Pendente'
              updated.push({
                ...ben,
                id: Date.now().toString(),
                status: 'Pendente',
                previousBeneficiary: { name: existing.name, cpf: existing.cpf, issueDate: existing.issueDate },
                previousCpf: existing.cpf,
                previousName: existing.name,
                previousDate: existing.issueDate,
                changeDate: nowIso,
              } as unknown as Beneficiary);
            } else {
              // Edição simples de outros campos
                updated[idx] = { ...existing, ...ben } as Beneficiary;
            }
            return updated as Beneficiary[];
          }
        }

        // Caso padrão: substituição por ID
        return prev.map((b) => (b.id === ben.id ? ({ ...b, ...ben } as Beneficiary) : b));
      });
    };

    window.addEventListener('submitEditBeneficiary', onSubmitEdit as EventListener);
    return () => window.removeEventListener('submitEditBeneficiary', onSubmitEdit as EventListener);
  }, [setBeneficiaries]);

  /**
   * Efeito para cancelar uma alteração pendente (regra do Azul).
   */
  useEffect(() => {
    const onCancel = (e: any) => {
      const id: string = e?.detail?.id;
      if (!id) return;

      setBeneficiaries((prev) => {
        const target = prev.find((b) => b.id === id);
        if (!target || !target.previousBeneficiary) return prev;

        // Remove o beneficiário 'novo' (pendente) e restaura o 'antigo'
        const restored = prev
          .filter((b) => b.id !== id)
          .map((b) => {
            if (b.cpf === target.previousBeneficiary?.cpf && b.program === 'azul') {
              // Restaura o status do beneficiário anterior para 'Utilizado'
              return ({ ...b, status: 'Utilizado', changeDate: undefined, previousBeneficiary: undefined } as Beneficiary);
            }
            return b;
          }) as Beneficiary[];
        return restored;
      });
    };

    window.addEventListener('cancelChangeBeneficiary', onCancel as EventListener);
    return () => window.removeEventListener('cancelChangeBeneficiary', onCancel as EventListener);
  }, [setBeneficiaries]);

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