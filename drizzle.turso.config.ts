import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: "libsql://matchfinder-pixelbuyte.aws-us-east-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQyNDY1OTQsImlkIjoiMDE5ZDE5NTUtYjIwMS03Mjc1LWE4MzgtNDNlNzVlZWE0MDA4IiwicmlkIjoiNDcwZDdiOWItZmUxMy00ZTkyLTk0OTUtMGZjZjlkNDIwNTNjIn0.yqoAktJYdaAoPVB-VqASCNqigiQfOqZZIC5ebRow35QfkXSSnzN8iCE1W4SrbckFpg54MlhSqAbwOb2jIPvbAw",
  },
});
