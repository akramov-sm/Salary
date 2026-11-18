// Загружает .env.local для скриптов вне Next.js (drizzle-kit, seed).
// Внутри Next.js переменные подхватываются автоматически.
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
