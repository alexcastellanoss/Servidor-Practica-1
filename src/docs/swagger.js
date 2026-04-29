import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'BildyApp API',
            version: '1.0.0',
            description: 'API REST para gestión de proyectos, clientes y albaranes de construcción',
            license: {
                name: 'MIT',
                url: 'https://spdx.org/licenses/MIT.html'
            },
            contact: {
                name: 'BildyApp',
                email: 'info@bildyapp.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de desarrollo'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        name: { type: 'string', example: 'John' },
                        lastName: { type: 'string', example: 'Doe' },
                        nif: { type: 'string', example: '12345678A' },
                        role: { type: 'string', enum: ['admin', 'guest'], example: 'admin' },
                        status: { type: 'string', enum: ['pending', 'verified'], example: 'verified' },
                        company: { type: 'string', example: '507f1f77bcf86cd799439011' }
                    }
                },
                Company: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'NovaTech Solutions SL' },
                        cif: { type: 'string', example: 'B87654321' },
                        address: { $ref: '#/components/schemas/Address' },
                        logo: { type: 'string', example: 'http://localhost:3000/uploads/logo.jpg' },
                        isFreelance: { type: 'boolean', example: false }
                    }
                },
                Client: {
                    type: 'object',
                    required: ['name', 'cif'],
                    properties: {
                        name: { type: 'string', example: 'Constructora ABC' },
                        cif: { type: 'string', example: 'B12345678' },
                        email: { type: 'string', format: 'email', example: 'contact@abc.com' },
                        phone: { type: 'string', example: '+34912345678' },
                        address: { $ref: '#/components/schemas/Address' }
                    }
                },
                Project: {
                    type: 'object',
                    required: ['client', 'name', 'projectCode'],
                    properties: {
                        client: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        name: { type: 'string', example: 'Edificio Residencial Centro' },
                        projectCode: { type: 'string', example: 'PROJ-2024-001' },
                        address: { $ref: '#/components/schemas/Address' },
                        email: { type: 'string', format: 'email' },
                        notes: { type: 'string' },
                        active: { type: 'boolean', example: true }
                    }
                },
                DeliveryNote: {
                    type: 'object',
                    required: ['client', 'project', 'format', 'description', 'workDate'],
                    properties: {
                        client: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        project: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        format: { type: 'string', enum: ['material', 'hours'], example: 'material' },
                        description: { type: 'string', example: 'Entrega de cemento y arena' },
                        workDate: { type: 'string', format: 'date', example: '2024-04-15' },
                        material: { type: 'string', example: 'Cemento' },
                        quantity: { type: 'number', example: 50 },
                        unit: { type: 'string', example: 'sacos' },
                        hours: { type: 'number', example: 8 },
                        workers: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', example: 'Juan Pérez' },
                                    hours: { type: 'number', example: 8 }
                                }
                            }
                        },
                        signed: { type: 'boolean', example: false },
                        signatureUrl: { type: 'string' },
                        pdfUrl: { type: 'string' }
                    }
                },
                Address: {
                    type: 'object',
                    properties: {
                        street: { type: 'string', example: 'Calle Mayor' },
                        number: { type: 'string', example: '42' },
                        postal: { type: 'string', example: '28013' },
                        city: { type: 'string', example: 'Madrid' },
                        province: { type: 'string', example: 'Madrid' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Error message' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);