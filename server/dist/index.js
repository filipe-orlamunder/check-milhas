"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const auth_1 = __importDefault(require("./routes/auth"));
const profiles_1 = __importDefault(require("./routes/profiles"));
const beneficiaries_1 = __importDefault(require("./routes/beneficiaries"));
const validation_1 = __importDefault(require("./routes/validation"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const port = process.env.PORT || 3000;
// OpenAPI (Swagger)
const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "Check-Milhas API",
        version: "1.0.0",
        description: "API do projeto Check-Milhas — gerenciamento de beneficiários nos programas Latam Pass, Smiles e Azul Fidelidade. Inclui autenticação, perfis, beneficiários e validação dinâmica."
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
            // Definições de esquema para Autenticação
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
            // Definições de esquema para Perfis
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
            // Definições de esquema para Beneficiários
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
            // Definições de esquema para Validação Dinâmica
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
        // Rotas de Autenticação
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
        // Rotas de Perfis
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
        // Rotas de Beneficiários
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
        // Rotas de Validação Dinâmica
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
// Swagger UI
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// Rotas
app.use("/auth", auth_1.default);
app.use("/", profiles_1.default);
app.use("/", beneficiaries_1.default);
app.use("/", validation_1.default);
// Erros (global)
app.use(errorHandler_1.errorHandler);
app.listen(port, () => {
    console.log(`Server rodando em http://localhost:${port}`);
    console.log(`Swagger em http://localhost:${port}/api-docs`);
});
