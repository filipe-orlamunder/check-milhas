# Check Milhas
## Gestão Inteligente de Emissões de Passagens Aéreas com Milhas

## 🧩 Visão Geral
O **Check Milhas** é uma aplicação web criada para organizar, automatizar e facilitar o gerenciamento de beneficiários nos principais programas de fidelidade brasileiros — **Latam Pass**, **Smiles** e **Azul Fidelidade**.  
A plataforma calcula automaticamente carências, bloqueios e liberações, aplica regras específicas de cada programa e apresenta uma visão clara do status de cada beneficiário para evitar perdas de oportunidades na emissão de passagens aéreas com milhas.

---

## 🌐 Ambiente de Produção
Acesse a versão online do Check Milhas:  
👉 **https://check-milhas.replit.app/**

## 🔗 Repositório
Código-fonte e histórico estão no GitHub:  
👉 **https://github.com/filipe-orlamunder/check-milhas**

---

## 🎯 Objetivo do Sistema
Centralizar, organizar e automatizar o **controle de beneficiários** em programas de milhas, dando ao usuário uma visão completa sobre prazos, limites e liberações — reduzindo falhas e permitindo o uso estratégico das milhas.

---

## ⚙️ Funcionalidades Principais

### 🔐 Autenticação e Segurança
- Cadastro e login de usuários com validação de credenciais.  
- Sessões autenticadas via **JWT**.  
- Proteção de rotas e dados sensíveis.

### 👥 Gerenciamento de Perfis
- Cadastro de múltiplos perfis por usuário (titulares das milhas).  
- CPF como identificador único por perfil.  
- Organização ideal para famílias ou gestão terceirizada.

### 🧾 Controle de Beneficiários
- Cadastro rápido de beneficiários com CPF e data de cadastro.  
- Validações automáticas: limites por programa, unicidade de CPF, carências e bloqueios.  
- Indicadores visuais de status:
  - 🟢 **Liberado** — disponível para substituição  
  - 🟡 **Pendente** — em alteração (troca em andamento) 
  - 🔴 **Utilizado** — slot ocupado  
- Contagem regressiva automática para liberação.

### ✈️ Regras Automatizadas por Programa
- **Latam Pass**: limite de 25 beneficiários; bloqueio por 365 dias.  
- **Smiles**: limite de 25 beneficiários; bloqueio durante o ano civil do cadastro.  
- **Azul Fidelidade**: lista fixa de 5 beneficiários (sem data de liberação); carência de 30 dias para troca com substituição automática após o prazo.

### 📊 Dashboard Inteligente
- Resumo por perfil e por programa.  
- Quantidade e listagem dos beneficiários liberados na data informada.  
- Consulta futura: simular quantos estarão liberados em uma data informada.

---

## 🔑 Usuários de Demonstração (para testes)

### 👨‍💼 Administrador 1
- **Email:** adm1@test.com  
- **Senha:** Admin123

### 👨‍💼 Administrador 2
- **Email:** adm2@test.com  
- **Senha:** Admin123

---

## 🏗️ Arquitetura & Tecnologias

### 🖥️ Frontend
- **React.js + Vite**  
- TypeScript  
- TailwindCSS  
- Validações client-side

### 🛠️ Backend
- **Node.js + Express** 
- TypeScript
- API REST  
- Autenticação JWT  
- Prisma ORM  
- Middlewares de validação (Zod)  

### 🗄️ Banco de Dados
- **PostgreSQL**

---

## 💻 Como Executar o Projeto
### 1. Clonar o Repositório

```bash
git clone https://github.com/filipe-orlamunder/check-milhas.git
cd check-milhas
```

### 2. Executar o Frontend (client)

Instalar dependências e rodar:

```bash
cd client
npm install
npm run dev
```

Rodar testes com cobertura:

```bash
npm run coverage
```

### 3. Executar o Backend (server)

Instalar dependências e rodar:

```bash
cd server
npm install
npm install @prisma/client prisma
npx prisma generate
npm run dev
```

Rodar testes com cobertura:

```bash
npm run coverage
```

### 4. Testes

O projeto utiliza Vitest para testes unitários, snapshots e cobertura. Execute `npm run coverage` nas pastas `client` e `server` para gerar o relatório.

---

## Autor

**Filipe Luiz Orlamünder**

---

**Data**: Segundo semestre de 2025

**Versão**: 1.0.0
