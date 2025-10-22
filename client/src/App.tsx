import { useEffect, useState } from "react";
import { User, Profile, Beneficiary, Screen } from "./types";
import { LoginForm } from "./components/auth/LoginForm";
import { SignupForm } from "./components/auth/SignupForm";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ProfileView } from "./components/dashboard/ProfileView";
import { ProgramScreen } from "./components/programs/ProgramScreen";

/**
 * Custom hook para gerenciar o estado local com persistência no localStorage.
 */
function useLocalState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initialValue;

      // Tenta desserializar o JSON ou usa o valor bruto.
      try {
        return JSON.parse(raw) as T;
      } catch {
        return (raw as unknown) as T;
      }
    } catch {
      // Retorna o valor inicial em caso de erro no acesso ao localStorage.
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (state === null) {
        // Remove o item se o estado for null (ex: logout).
        localStorage.removeItem(key);
        return;
      }

      // Armazena primitivos como string simples.
      if (
        typeof state === "string" ||
        typeof state === "number" ||
        typeof state === "boolean"
      ) {
        localStorage.setItem(key, String(state));
        return;
      }

      // Armazena objetos/arrays como JSON.
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignora erros de escrita no localStorage.
    }
  }, [key, state]);

  return [state, setState] as const;
}

/**
 * Componente principal da aplicação, responsável pelo roteamento e estado global.
 */
function App() {
  // Gerenciamento de navegação e autenticação
  const [currentScreen, setCurrentScreen] = useLocalState<Screen>(
    "currentScreen",
    "login"
  );
  const [currentUser, setCurrentUser] = useLocalState<User | null>(
    "currentUser",
    null
  );
  const [token, setToken] = useLocalState<string | null>("token", null);

  // Gerenciamento de dados locais
  const [users, setUsers] = useLocalState<User[]>("users", []);
  const [profiles, setProfiles] = useLocalState<Profile[]>("profiles", []);
  const [beneficiaries, setBeneficiaries] = useLocalState<Beneficiary[]>(
    "beneficiaries",
    []
  );
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  /**
   * Handler de login: define usuário, token e navega para o dashboard.
   */
  const handleLogin = (user: User, tokenFromServer?: string | null) => {
    if (tokenFromServer) {
      setToken(tokenFromServer);
    }
    // Adiciona o usuário se for novo.
    setUsers((prev) => {
      if (!prev.some((u) => u.email === user.email)) return [...prev, user];
      return prev;
    });
    setCurrentUser(user);
    setCurrentScreen("dashboard");
  };

  /**
   * Handler de logout: limpa dados de autenticação e volta para o login.
   */
  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setCurrentScreen("login");
  };

  /**
   * Handler de cadastro: define usuário, token e navega para o dashboard.
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
   * Adiciona um novo perfil à lista.
   */
  const handleAddProfile = (profile: Profile) => {
    setProfiles((prev) => [...prev, profile]);
  };

  /**
   * Deleta um perfil e todos os beneficiários associados.
   */
  const handleDeleteProfile = (profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    setBeneficiaries((prev) => prev.filter((b) => b.profileId !== profileId));
  };

  /**
   * Adiciona um novo beneficiário.
   */
  const handleAddBeneficiary = (beneficiary: Beneficiary) => {
    setBeneficiaries((prev) => [...prev, beneficiary]);
  };

  /**
   * Deleta um beneficiário por ID.
   */
  const handleDeleteBeneficiary = (id: string) => {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
  };

  /**
   * Deleta todos os beneficiários de um perfil em um programa específico.
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
   * Lógica local para edição e substituição de beneficiários (especialmente AZUL).
   */
  useEffect(() => {
    const onSubmitEdit = (e: any) => {
      const ben: Beneficiary = e?.detail?.beneficiary;
      if (!ben) return;

      setBeneficiaries((prev) => {
        // Regras locais para Azul: se houver substituição (CPF diferente), marcar ambos como Pendente e aplicar changeDate
        if (ben.program === 'azul') {
          const idx = prev.findIndex((b) => b.id === ben.id);
          if (idx !== -1) {
            // Edita beneficiário existente
            const updated = [...prev];
            const existing = updated[idx];
            // Inicia alteração pendente se o CPF mudou
            if (existing.cpf !== ben.cpf) {
              const nowIso = new Date().toISOString();
              // Beneficiário antigo se torna PENDENTE
              updated[idx] = { ...existing, status: 'Pendente', changeDate: nowIso } as Beneficiary;
              // Adiciona novo beneficiário como PENDENTE
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
              // Simples edição de campos
              updated[idx] = { ...existing, ...ben } as Beneficiary;
            }
            return updated as Beneficiary[];
          }
        }

        // Default: substitui beneficiário pelo ID
        return prev.map((b) => (b.id === ben.id ? ({ ...b, ...ben } as Beneficiary) : b));
      });
    };

    // Adiciona listener para submissão de edição
    window.addEventListener('submitEditBeneficiary', onSubmitEdit as EventListener);
    return () => window.removeEventListener('submitEditBeneficiary', onSubmitEdit as EventListener);
  }, [setBeneficiaries]);

  /**
   * Lógica local para cancelar alteração pendente (Azul).
   */
  useEffect(() => {
    const onCancel = (e: any) => {
      const id: string = e?.detail?.id;
      if (!id) return;

      setBeneficiaries((prev) => {
        // Encontra o beneficiário pendente alvo
        const target = prev.find((b) => b.id === id);
        if (!target) return prev;

        if (target.previousBeneficiary) {
          // Remove o novo e restaura o status do antigo.
          const restored = prev
            .filter((b) => b.id !== id)
            .map((b) => {
              // Restaura o beneficiário original que se tornou PENDENTE
              if (b.cpf === target.previousBeneficiary?.cpf && b.program === 'azul') {
                return ({ ...b, status: 'Utilizado', changeDate: undefined, previousBeneficiary: undefined } as Beneficiary);
              }
              return b;
            }) as Beneficiary[];
          return restored;
        }

        return prev;
      });
    };

    // Adiciona listener para cancelamento de alteração
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
