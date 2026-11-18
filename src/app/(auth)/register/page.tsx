import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = { title: "Регистрация — Salary" };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
