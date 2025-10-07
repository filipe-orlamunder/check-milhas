// src/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import authRouter from "./routes/auth";
import profilesRouter from "./routes/profiles";
import beneficiariesRouter from "./routes/beneficiaries";
import validationRouter from "./routes/validation";

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

/**
 * Swagger Specification
 * Documenta todas as rotas principais da API.
 */
const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Check-Milhas API",
    version: "1.0.0",
    description:
      "API do projeto Check-Milhas — gerenciamento de beneficiários nos programas Latam Pass, Smiles e Azul Fidelidade. Inclui autenticação, perfis, beneficiários e validação dinâmica."
  },
  servers: [{ url: `http://localhost:${port}` }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      // =============== AUTH ==================
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Filipe Orlamunder" },
          email: {
            type: "string",
            format: "email",
            example: "filipe@exemplo.com"
          },
          password: { type: "string", example: "minhaSenha123" }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "filipe@exemplo.com" },
          password: { type: "string", example: "minhaSenha123" }
        }
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" }
            }
          }
        }
      },

      // =============== PROFILES ==================
      ProfileRequest: {
        type: "object",
        required: ["name", "cpf"],
        properties: {
          name: { type: "string", example: "Perfil Principal" },
          cpf: { type: "string", example: "12345678901" }
        }
      },
      ProfileResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          cpf: { type: "string" },
          userId: { type: "string" },
          createdAt: { type: "string" }
        }
      },

      // =============== BENEFICIARIES ==================
      BeneficiaryRequest: {
        type: "object",
        required: ["program", "name", "cpf", "issueDate"],
        properties: {
          program: {
            type: "string",
            enum: ["LATAM", "SMILES", "AZUL"],
            example: "LATAM"
          },
          name: { type: "string", example: "João Silva" },
          cpf: { type: "string", example: "12345678900" },
          issueDate: { type: "string", format: "date", example: "2025-09-10" }
        }
      },
      BeneficiaryResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          profileId: { type: "string" },
          program: { type: "string" },
          name: { type: "string" },
          cpf: { type: "string" },
          issueDate: { type: "string" },
          status: { type: "string" }
        }
      },

      // =============== VALIDATION ==================
      ValidationDynamicResponse: {
        type: "object",
        properties: {
          profileId: { type: "string" },
          profileName: { type: "string" },
          profileCpf: { type: "string" },
          available: {
            type: "object",
            properties: {
              LATAM: { type: "integer", example: 20 },
              SMILES: { type: "integer", example: 18 },
              AZUL: { type: "integer", example: 3 }
            }
          }
        }
      }
    }
  },
  paths: {
    // =============== AUTH ==================
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar novo usuário",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } }
          }
        },
        responses: {
          "201": {
            description: "Usuário criado",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } }
            }
          },
          "400": { description: "Requisição inválida" }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Autenticar usuário (login)",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } }
          }
        },
        responses: {
          "200": {
            description: "Autenticado",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } }
            }
          },
          "400": { description: "Credenciais inválidas" }
        }
      }
    },

    // =============== PROFILES ==================
    "/profiles": {
      get: {
        tags: ["Profiles"],
        summary: "Listar perfis do usuário autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista de perfis",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/ProfileResponse" } }
              }
            }
          }
        }
      },
      post: {
        tags: ["Profiles"],
        summary: "Criar novo perfil",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ProfileRequest" } }
          }
        },
        responses: { "201": { description: "Perfil criado" } }
      }
    },
    "/profiles/{id}": {
      delete: {
        tags: ["Profiles"],
        summary: "Excluir perfil por ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Perfil excluído" } }
      }
    },

    // =============== BENEFICIARIES ==================
    "/profiles/{profileId}/beneficiaries": {
      get: {
        tags: ["Beneficiaries"],
        summary: "Listar beneficiários de um perfil",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "profileId", in: "path", required: true, schema: { type: "string" } },
          {
            name: "program",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["LATAM", "SMILES", "AZUL"] }
          }
        ],
        responses: {
          "200": {
            description: "Lista de beneficiários",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/BeneficiaryResponse" } }
              }
            }
          }
        }
      },
      post: {
        tags: ["Beneficiaries"],
        summary: "Adicionar beneficiário a um perfil",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "profileId", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/BeneficiaryRequest" } }
          }
        },
        responses: {
          "201": { description: "Beneficiário criado" },
          "400": { description: "Requisição inválida" }
        }
      },
      delete: {
        tags: ["Beneficiaries"],
        summary: "Excluir todos beneficiários de um programa específico",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "profileId", in: "path", required: true, schema: { type: "string" } },
          {
            name: "program",
            in: "query",
            required: true,
            schema: { type: "string", enum: ["LATAM", "SMILES", "AZUL"] }
          }
        ],
        responses: { "200": { description: "Beneficiários excluídos" } }
      }
    },
    "/beneficiaries/{id}": {
      put: {
        tags: ["Beneficiaries"],
        summary: "Editar beneficiário",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/BeneficiaryRequest" } }
          }
        },
        responses: { "200": { description: "Beneficiário atualizado" } }
      },
      delete: {
        tags: ["Beneficiaries"],
        summary: "Excluir beneficiário por ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Beneficiário excluído" } }
      }
    },
    "/beneficiaries/{id}/cancel-change": {
      post: {
        tags: ["Beneficiaries"],
        summary: "Cancelar alteração pendente (AZUL)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Alteração cancelada" } }
      }
    },

    // =============== VALIDAÇÃO DINÂMICA ==================
    "/validation-dynamic": {
      get: {
        tags: ["Validação Dinâmica"],
        summary: "Retorna, por perfil, a quantidade de beneficiários disponíveis",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "date",
            in: "query",
            required: false,
            schema: { type: "string", format: "date" }
          }
        ],
        responses: {
          "200": {
            description: "Lista de disponibilidades",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/ValidationDynamicResponse" } }
              }
            }
          }
        }
      }
    }
  }
};

// === Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// === Rotas
app.use("/auth", authRouter);
app.use("/", profilesRouter);
app.use("/", beneficiariesRouter);
app.use("/", validationRouter);

// === Start
app.listen(port, () => {
  console.log(`🚀 Server rodando em http://localhost:${port}`);
  console.log(`📘 Swagger disponível em http://localhost:${port}/api-docs`);
});
