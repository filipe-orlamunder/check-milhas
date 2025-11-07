# Check Milhas - Gestão Inteligente de Emissões de Passagens Aéreas com Milhas

## Resumo

O Check Milhas é um sistema web desenvolvido para auxiliar na gestão e controle da emissão de passagens aéreas utilizando milhas acumuladas nos principais programas de fidelidade brasileiros: Latam Pass, Smiles e Azul Fidelidade. O sistema permite o gerenciamento completo de beneficiários, respeitando as regras específicas de cada programa, incluindo limites de cadastros, prazos de carência e restrições de alteração.

## Sumário

1. [Contexto e Justificativa](#contexto-e-justificativa)
2. [Objetivos](#objetivos)
3. [Descrição do Sistema](#descrição-do-sistema)
4. [Requisitos Funcionais](#requisitos-funcionais)
5. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
6. [Utilização](#utilização)
7. [Testes](#testes)
8. [Referências](#referências)

---

## Contexto e Justificativa

Os programas de fidelidade aéreos representam uma importante ferramenta para usuários frequentes de transporte aéreo, permitindo o acúmulo de pontos (milhas) que podem ser convertidos em passagens gratuitas ou com desconto. No Brasil, os três principais programas são o Latam Pass (Latam Airlines), Smiles (Gol Linhas Aéreas) e Azul Fidelidade (Azul Linhas Aéreas).

Cada programa estabelece regras específicas para o cadastro e gerenciamento de beneficiários - pessoas autorizadas a receber passagens emitidas com as milhas do titular da conta. Essas regras incluem:

- **Limites quantitativos**: número máximo de beneficiários permitidos
- **Restrições temporais**: períodos de carência para utilização após o cadastro
- **Períodos de bloqueio**: intervalos obrigatórios após remoção ou alteração de beneficiários
- **Prazos de validade**: tempo mínimo de permanência no cadastro

A complexidade e diversidade dessas normativas dificultam o acompanhamento manual por parte dos usuários, podendo resultar em perda de oportunidades de emissão de passagens ou até mesmo em bloqueios temporários nas contas por descumprimento das regras. Além disso, usuários que gerenciam milhas de múltiplos perfis (familiares, por exemplo) enfrentam uma complexidade ainda maior.

Neste contexto, o desenvolvimento de um sistema informatizado que centralize e automatize o controle dessas informações mostra-se relevante, trazendo benefícios em termos de organização, eficiência e aproveitamento estratégico dos recursos acumulados.

---

## Objetivos

### Objetivo Geral

Desenvolver uma aplicação web que possibilite o cadastro, gerenciamento e monitoramento de beneficiários em programas de fidelidade aéreos, fornecendo informações claras sobre o status de cada beneficiário de acordo com as regras específicas de cada programa.

### Objetivos Específicos

1. **Implementar sistema de autenticação seguro** para proteção dos dados dos usuários
2. **Permitir o gerenciamento de múltiplos perfis** por usuário, facilitando o controle de contas de terceiros
3. **Desenvolver módulo de cadastro de beneficiários** com validação automática das regras de cada programa
4. **Implementar cálculo dinâmico de status** dos beneficiários com base em datas e regras específicas
5. **Fornecer interface intuitiva** com visualização clara do status atual e prazos relevantes
6. **Garantir integridade dos dados** através de validações no backend e frontend
7. **Implementar testes automatizados** para assegurar a confiabilidade do sistema

---

## Descrição do Sistema

O Check Milhas é uma aplicação web que opera com arquitetura cliente-servidor, onde o frontend apresenta uma interface responsiva e intuitiva, enquanto o backend gerencia a lógica de negócios, persistência de dados e autenticação.

### Funcionalidades Principais

#### 1. Autenticação e Autorização

O sistema implementa autenticação baseada em JWT (JSON Web Token), garantindo que apenas usuários autorizados possam acessar e modificar seus dados. O processo inclui:

- Cadastro de novos usuários com validação de email único
- Login com credenciais criptografadas (bcrypt)
- Proteção de rotas através de middleware de autenticação
- Sessão persistente através de token armazenado localmente

#### 2. Gerenciamento de Perfis

Cada usuário pode cadastrar múltiplos perfis, representando diferentes titulares de contas de programas de fidelidade. Para cada perfil, são armazenados:

- Nome completo do titular
- CPF (único no sistema)
- Vínculo com o usuário proprietário

Esta funcionalidade é especialmente útil para usuários que gerenciam milhas de familiares ou assessoram outras pessoas no uso de programas de fidelidade.

#### 3. Controle de Beneficiários

O módulo central do sistema permite o cadastro e acompanhamento de beneficiários em cada programa de fidelidade. As funcionalidades incluem:

**Cadastro de Beneficiários:**
- Nome completo
- CPF
- Programa de fidelidade (LATAM Pass, Smiles ou Azul Fidelidade)
- Data de cadastro no programa
- Dados de um novo beneficiário (específico para o programa Azul Fidelidade)

**Validações Automáticas:**
- Verificação de limite máximo de beneficiários por programa
- Validação de unicidade de CPF dentro do mesmo programa e perfil
- Controle de períodos de carência e bloqueio

**Cálculo Dinâmico de Status:**

O sistema calcula automaticamente o status de cada beneficiário com base nas regras específicas:

- **LIBERADO**: beneficiário disponível para emissão de passagens
- **PENDENTE**: em período de carência ou bloqueio
- **UTILIZADO**: beneficiário ainda não liberado para um novo cadastro

**Visualização de Informações:**
- Status atual com indicadores visuais (cores diferenciadas)
- Contadores regressivos para liberação

#### 4. Regras Específicas por Programa

O sistema implementa as regras particulares de cada programa:

**LATAM Pass:**
- Limite: 25 beneficiários
- Bloqueio: Durante 365 dias após o cadastro

**Smiles:**
- Limite: 25 beneficiários
- Bloqueio: Durante o ano civil do cadastro

**Azul Fidelidade:**
- Limite: 5 beneficiários
- Bloqueio: Não possui prazo para liberação
- Troca: Possui carência de 30 dias após o novo cadastro

---

## Requisitos Funcionais

### RF01 - Cadastro de Usuário
Permitir a criação de cadastro de um **novo usuário**, com **login** e **senha**.

### RF02 - Login
Permitir **login** com e-mail e senha **válidos**.

### RF03 - Cadastro de Perfis
Permitir o cadastro de **até 10 perfis por usuário**.

### RF04 - Acesso a Programas de Fidelidade por Perfil
Permitir que cada perfil possa acessar os **3 programas de fidelidade** (Latam Pass, Smiles, Azul Fidelidade).

### RF05 - Cadastro de Beneficiários
Permitir cadastrar **beneficiários** com **nome completo**, **CPF** e **data de emissão/cadastro**.

### RF06 - Controle de Status dos Beneficiários
Aplicar **controle de status** dos beneficiários, conforme regulamentos de cada programa:

* **Latam Pass:** Limite de **25 beneficiários** a cada **12 meses**.
* **Smiles:** Limite de **25 beneficiários** por **ano civil**.
* **Azul Fidelidade:** Lista **fixa de 5 beneficiários**, com **carência de 30 dias** para substituição.

### RF07 - Exibição de Beneficiários na Tela Inicial
Exibir na **tela inicial** a **quantidade de beneficiários cadastrados** em cada **perfil** do usuário logado.

### RF08 - Exibição de Beneficiários por Programa
Exibir, na **tela de cada programa**, os dados dos beneficiários cadastrados com **status atual**.

### RF09 - Validação Dinâmica (Status)
Apresentar no botão **Validação Dinâmica** a lista de **beneficiários** em **todos os perfis e programas de fidelidade**, mostrando a **quantidade de status liberados**.

### RF10 - Validação Dinâmica (Consulta Futura)
Permitir informar uma **data futura** na Validação Dinâmica, para **consulta da quantidade de beneficiários liberados** na data informada.

### RF11 - Edição e Exclusão de Beneficiários
Permitir **edição** e **exclusão** de beneficiários com **confirmação prévia**.

### RF12 - Acompanhamento da Troca de Beneficiários (Azul Fidelidade)
Permitir **acompanhamento da troca** de beneficiários pendentes no Azul Fidelidade.

### RF13 - Conclusão Automática de Troca (Azul Fidelidade)
Completar a **troca de beneficiário** no Azul Fidelidade de forma **automática** após o período de **carência de 30 dias**.

---

## Requisitos Não-Funcionais

### RNF01 - Usabilidade e Design
A **interface do sistema** deve ser **intuitiva** e **responsiva**.

### RNF02 - Segurança de Dados
As informações dos usuários e beneficiários devem ser armazenadas de forma **segura** no banco de dados.

### RNF03 - Desempenho
O sistema deve apresentar **bom desempenho**, com **tempos de resposta rápidos** para as interações do usuário.

### RNF04 - Manutenibilidade e Escalabilidade
O sistema deve ser desenvolvido utilizando **tecnologias que garantam manutenibilidade e escalabilidade futuras**.

### RNF05 - Compatibilidade
O sistema deve ser **compatível com os navegadores web modernos** mais utilizados.

---

## Arquitetura e Tecnologias

O Check Milhas foi desenvolvido utilizando uma stack moderna de tecnologias JavaScript/TypeScript, seguindo padrões de arquitetura amplamente adotados pela indústria.

### Arquitetura Geral

```
┌─────────────────────────────────────────┐
│          Cliente (Browser)              │
│   ┌─────────────────────────────────┐   │
│   │   Frontend - React + Vite       │   │
│   │   - Interface de Usuário        │   │
│   │   - Gerenciamento de Estado     │   │
│   │   - Validações Cliente-Side     │   │
│   └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │ HTTP/HTTPS (API REST)
               ↓
┌─────────────────────────────────────────┐
│      Servidor (Node.js + Express)       │
│   ┌─────────────────────────────────┐   │
│   │   Backend API                   │   │
│   │   - Rotas e Controllers         │   │
│   │   - Lógica de Negócios          │   │
│   │   - Autenticação JWT            │   │
│   │   - Validações Servidor-Side    │   │
│   └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │ Prisma ORM
               ↓
┌─────────────────────────────────────────┐
│      Banco de Dados (PostgreSQL)        │
│   - Usuários                            │
│   - Perfis                              │
│   - Beneficiários                       │
└─────────────────────────────────────────┘
```

## Utilização

### Fluxo de Uso Típico

#### 1. Criação de Conta

1. Acesse a aplicação através do navegador
2. Clique em "Criar Conta"
3. Preencha os dados: nome, email e senha
4. Confirme o cadastro

#### 2. Login no Sistema

1. Informe email e senha cadastrados
2. O sistema gerará um token de autenticação
3. Você será redirecionado para o dashboard

#### 3. Cadastro de Perfil

1. No dashboard, clique em "Adicionar Perfil"
2. Informe o nome e CPF do titular das milhas
3. Confirme o cadastro
4. O perfil aparecerá na lista de perfis disponíveis

#### 4. Gerenciamento de Beneficiários

**Adicionar Beneficiário:**

1. Selecione um perfil
2. Escolha o programa de fidelidade (Latam, Smiles ou Azul)
3. Clique em "Adicionar Beneficiário"
4. Preencha os dados:
   - Nome completo
   - CPF
   - Data de cadastro no programa
   - (Azul) Dados do beneficiário anterior, se aplicável
5. O sistema validará automaticamente:
   - Limite de beneficiários não excedido
   - CPF único dentro do programa
   - Dados corretamente preenchidos
6. Confirme o cadastro

**Visualizar Status:**

O sistema exibirá para cada beneficiário:
- Status atual (cores indicativas):
  - 🟢 Verde: LIBERADO (para uso)
  - 🟡 Amarelo: PENDENTE (em carência)
  - 🔴 Vermelho: UTILIZADO (slot ocupado)
- Dias restantes até liberação (quando aplicável)

**Editar Beneficiário:**

1. Clique no beneficiário desejado
2. Modifique os dados necessários
3. O sistema validará as alterações conforme regras do programa
4. Confirme a edição

**Remover Beneficiário:**

1. Clique no botão de remoção do beneficiário
2. Confirme a ação

#### 5. Verificação de Disponibilidade

Antes de emitir uma passagem, consulte o dashboard para:
- Verificar se o beneficiário está com status LIBERADO
- Confirmar que não há período de carência ativo
- Validar que o slot não está em período de bloqueio

---

## Testes

O projeto implementa testes automatizados tanto no frontend quanto no backend, utilizando o framework Vitest.

### Executando os Testes

**Backend:**
```bash
cd server
npm test              # Executa todos os testes
npm run test:watch    # Modo watch para desenvolvimento
```

**Frontend:**
```bash
cd client
npm test              # Executa todos os testes
npm run test:watch    # Modo watch para desenvolvimento
```

### Cobertura de Testes

O projeto inclui testes para:

**Backend:**
- Middleware de autenticação
- Handler de erros
- Utilitários de cálculo de status
- Validadores
- Funções auxiliares de data
- Serviços de beneficiários

**Frontend:**
- Componentes isolados (Button)
- Funções de formatação
- Calculadores de status
- Lógica de negócios cliente-side

---

## Referências

### Programas de Fidelidade

- **Latam Pass**: https://www.latampass.latam.com
- **Smiles**: https://www.smiles.com.br
- **Azul Fidelidade**: https://www.azul.com.br/fidelidade

---

## Licença

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso e está disponível para fins acadêmicos e de pesquisa.

---

## Autor

**Filipe Orlamunder**

Trabalho de Conclusão de Curso apresentado como requisito para obtenção de título de graduação.

---

**Data**: Segundo semestre de 2025

**Versão**: 1.0.0