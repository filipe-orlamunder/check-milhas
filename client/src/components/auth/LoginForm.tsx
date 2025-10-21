import { useState } from "react";
import { User } from "../../types";
import { Eye, EyeOff } from "lucide-react";
import { apiPost } from "../../api";

interface LoginFormProps {
  onLogin: (user: User, token?: string | null) => void;
  onSwitchToSignup: () => void;
  users: User[];
}

/**
 * Valida o formato básico de um email.
 */
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Componente do formulário de login.
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onSwitchToSignup,
  users,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica se o formulário está preenchido e o email é válido.
  const isFormValid =
    email.trim() !== "" && validateEmail(email) && password.trim() !== "";

  /**
   * Envia as credenciais para o endpoint de login da API.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) return;

    setLoading(true);
    try {
      // Chamada à API para autenticação
      const resp = await apiPost("/auth/login", { email, password });
      
      const token = resp.token as string | undefined;
      const user = resp.user as User | undefined;

      if (user) {
        // Loga o token (apenas para debug)
        console.log(token);
        // Persiste o token no localStorage se existir
        if (token) localStorage.setItem("token", token);
        onLogin(user, token ?? null);
        return;
      }

      // Fallback local: Se a API não retornar um usuário, tenta autenticar localmente.
      const existing = users.find((u) => u.email === email);
      if (existing) {
        onLogin(existing, null);
        return;
      }
      
      // Cria usuário temporário em caso de falha de login (apenas para protótipo)
      const tempUser: User = {
        id: Date.now().toString(),
        name: email.split("@")[0] || "Usuário",
        email,
        password,
      };
      onLogin(tempUser, null);
    } catch (err: any) {
      // Exibe a mensagem de erro da API ou uma genérica.
      setError(
        err?.body?.error ??
          (err?.message as string) ??
          "Erro ao conectar com o servidor"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600">Faça login para acessar sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
              isFormValid
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Não tem uma conta?{" "}
            <button
              onClick={onSwitchToSignup}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
