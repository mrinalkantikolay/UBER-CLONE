import swaggerJsdoc from "swagger-jsdoc";
import env from "./env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Uber-Clone Backend API",
      version: "1.0.0",
      description: "Production-grade Uber-like backend API documentation",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            profilePhotoUrl: { type: "string", nullable: true },
            role: { type: "string", enum: ["USER", "DRIVER", "ADMIN"] },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Driver: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            vehicleNumber: { type: "string" },
            licenseNumber: { type: "string" },
            status: { type: "string", enum: ["AVAILABLE", "BUSY", "OFFLINE"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Ride: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            driverId: { type: "string", format: "uuid", nullable: true },
            status: { 
              type: "string", 
              enum: ["REQUESTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED_UNPAID", "COMPLETED_PAID", "CANCELLED"] 
            },
            originLat: { type: "number" },
            originLng: { type: "number" },
            destLat: { type: "number" },
            destLng: { type: "number" },
            fare: { type: "number", nullable: true },
            surgeMultiplier: { type: "number" },
            cancellationFee: { type: "number" },
            idempotencyKey: { type: "string" },
            acceptedAt: { type: "string", format: "date-time", nullable: true },
            completedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            traceId: { type: "string" },
            errors: { 
              type: "array", 
              items: { type: "object" },
              nullable: true 
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" },
            traceId: { type: "string" },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/routes/*.ts",
    "./src/controllers/*.ts",
    "./dist/routes/*.js",
    "./dist/controllers/*.js",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
