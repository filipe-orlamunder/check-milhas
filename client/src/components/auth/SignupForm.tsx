import { useState } from "react";
import { User } from "../../types";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { apiPost } from "../../api";

interface SignupFormProps {
  onSignup: (user: User, token?: string | null) => void;
  onSwitchToLogin: () => void;
  users: User[];
}

/**
 * Valida o formato básico de um email.
 */
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Valida o comprimento do nome (4 a 60 caracteres).
 */
const validateName = (name: string) => {
  const l = name.trim().length;
  return l >= 4 && l <= 60;
};

/**
 * Componente do formulário de cadastro de usuário.
 */
export const SignupForm: React.FC<SignupFormProps> = ({
  onSignup,
  onSwitchToLogin,
  users: _users,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  /**
   * Executa a validação de todos os campos do formulário.
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!validateName(name)) {
      newErrors.name = "Nome deve ter entre 4 e 60 caracteres";
    }
    if (!validateEmail(email)) {
      newErrors.email = "Email deve estar no formato correto";
    }
    // A senha deve ter pelo menos 6 caracteres.
    if (password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Determina se os valores atuais atendem aos requisitos mínimos.
  const isFormValid = validateName(name) && validateEmail(email) && password.length >= 6;

  /**
   * Envia os dados de registro para o endpoint da API.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    // Interrompe se a validação falhar.
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Chamada à API para registro
      const resp = await apiPost("/auth/register", { name, email, password });
      const token = resp.token as string | undefined;
      const user = resp.user as User | undefined;

      if (token && user) {
        // Persiste o token e efetua o login.
        localStorage.setItem("token", token);
        onSignup(user, token);
        return;
      }

      // Fallback local caso a API não retorne dados de autenticação.
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        password,
      };
      onSignup(newUser, null);
    } catch (err: any) {
      // Exibe a mensagem de erro da API ou uma genérica.
      setServerError(err?.body?.error ?? "Erro ao registrar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastro</h1>
          <p className="text-gray-600">Preencha seus dados para cadastro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              id="name"
              value={name}
              // Limita o nome a 60 caracteres.
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                errors.name ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"
              }`}
              placeholder="Digite seu nome completo"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Campo Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                errors.email ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"
              }`}
              placeholder="seu@email.com"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Campo Senha */}
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
                className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.password ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"
                }`}
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
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          {serverError && <p className="text-red-600 text-sm">{serverError}</p>}

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
              isFormValid
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={onSwitchToLogin}
            className="flex items-center justify-center w-full py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Login
          </button>
        </div>
      </div>
    </div>
  );
};
