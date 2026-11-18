import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = { title: "Вход — Salary" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
