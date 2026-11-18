import { cookies } from "next/headers";
import { resolveTz } from "@/lib/tz";

/** Часовой пояс пользователя из cookie `tz` (ставится клиентом), по умолчанию UTC. */
export async function getUserTz(): Promise<string> {
  const raw = (await cookies()).get("tz")?.value;
  try {
    return resolveTz(raw ? decodeURIComponent(raw) : null);
  } catch {
    return resolveTz(null);
  }
}
