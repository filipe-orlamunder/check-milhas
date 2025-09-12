// src/components/common/Button.tsx
import React from "react";

// Define as propriedades do componente, estendendo as propriedades padrão de um botão HTML
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

// Componente de botão reutilizável
export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className = "",
  children,
  ...props
}) => {
  // Estilos base para todos os botões
  const base =
    "inline-flex items-center justify-center px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  // Mapeamento de variantes de estilo
  const variants: Record<string, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-xl",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400 shadow-sm hover:shadow-md",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl",
  };

  // Combina classes base, variantes e classes adicionais
  const classes = [base, variants[variant], className].filter(Boolean).join(" ");
  
  // Renderiza o botão com as classes combinadas
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
