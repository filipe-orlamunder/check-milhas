// src/components/auth/SignupForm.tsx
import { useState } from 'react';
import { User } from '../../types';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

// Define as propriedades do componente de cadastro
interface SignupFormProps {
  onSignup: (user: User) => void;
  onSwitchToLogin: () => void;
  users: User[];
}

// Valida o formato do e-mail
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Valida o tamanho do nome
const validateName = (name: string) => {
  const l = name.trim().length;
  return l >= 4 && l <= 60;
};

// Componente principal do formulário de cadastro
export const SignupForm: React.FC<SignupFormProps> = ({
  onSignup,
  onSwitchToLogin,
  users: _users, // Renomeado para ignorar o aviso do TypeScript
}) => {
  // Estados para gerenciar os dados do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Função para validar o formulário e definir erros
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!validateName(name)) {
      newErrors.name = 'Nome deve ter entre 4 e 60 caracteres';
    }

    if (!validateEmail(email)) {
      newErrors.email = 'Email deve estar no formato correto';
    }

    if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verificação simples para habilitar/desabilitar o botão
  const isFormValid =
    validateName(name) &&
    validateEmail(email) &&
    password.length >= 6;

  // Lida com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        password,
      };
      onSignup(newUser);
    }
  };

  // Estrutura visual do formulário de cadastro
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastro</h1>
          <p className="text-gray-600">Preencha seus dados para cadastro</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de nome completo */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
              }`}
              placeholder="Digite seu nome completo"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Campo de e-mail */}
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
                errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
              }`}
              placeholder="seu@email.com"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Campo de senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                }`}
                placeholder="Digite sua senha"
              />
              {/* Botão para alternar a visibilidade da senha */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Botão de cadastro */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
              isFormValid
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Cadastrar
          </button>
        </form>

        {/* Botão para voltar ao login */}
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
