// src/App.tsx
import { useEffect, useState } from "react";
import { User, Profile, Beneficiary, Screen } from "./types";
import { LoginForm } from "./components/auth/LoginForm";
import { SignupForm } from "./components/auth/SignupForm";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ProfileView } from "./components/dashboard/ProfileView";
import { ProgramScreen } from "./components/programs/ProgramScreen";

// Hook personalizado para persistir o estado no localStorage
function useLocalState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignora erros ao salvar no localStorage
    }
  }, [key, state]);

  return [state, setState] as const;
}

// Componente principal da aplicação
function App() {
  // Estados para gerenciar a navegação e os dados da aplicação
  const [currentScreen, setCurrentScreen] = useLocalState<Screen>(
    "currentScreen",
    "login"
  );
  const [currentUser, setCurrentUser] = useLocalState<User | null>(
    "currentUser",
    null
  );
  const [users, setUsers] = useLocalState<User[]>("users", []);
  const [profiles, setProfiles] = useLocalState<Profile[]>("profiles", []);
  const [beneficiaries, setBeneficiaries] = useLocalState<Beneficiary[]>(
    "beneficiaries",
    []
  );
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  // Funções de manipulação de dados
  const handleLogin = (user: User) => {
    setUsers((prev) => {
      if (!prev.some((u) => u.email === user.email)) return [...prev, user];
      return prev;
    });
    setCurrentUser(user);
    setCurrentScreen("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen("login");
  };

  const handleSignup = (user: User) => {
    setUsers((prev) => [...prev, user]);
    setCurrentUser(user);
    setCurrentScreen("dashboard");
  };

  const handleAddProfile = (profile: Profile) => {
    setProfiles((prev) => [...prev, profile]);
  };

  const handleDeleteProfile = (profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    setBeneficiaries((prev) =>
      prev.filter((b) => b.profileId !== profileId)
    );
  };

  const handleAddBeneficiary = (beneficiary: Beneficiary) => {
    setBeneficiaries((prev) => [...prev, beneficiary]);
  };

  const handleDeleteBeneficiary = (id: string) => {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
  };

  const handleDeleteAllBeneficiaries = (
    profileId: string,
    program: "latam" | "smiles" | "azul"
  ) => {
    setBeneficiaries((prev) =>
      prev.filter(
        (b) => !(b.profileId === profileId && b.program === program)
      )
    );
  };

  // Renderização condicional dos componentes com base na tela atual
  if (currentUser) {
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

  // Renderiza a tela de cadastro se for a tela atual
  if (currentScreen === "signup") {
    return (
      <SignupForm
        onSignup={handleSignup}
        onSwitchToLogin={() => setCurrentScreen("login")}
        users={users}
      />
    );
  }

  // Renderiza a tela de login como padrão
  return (
    <LoginForm
      onLogin={handleLogin}
      onSwitchToSignup={() => setCurrentScreen("signup")}
      users={users}
    />
  );
}

export default App;
