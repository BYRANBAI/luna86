"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка авторизации");
        setLoading(false);
        return;
      }

      // Сохраняем токен в localStorage
      localStorage.setItem("guestToken", data.token);
      localStorage.setItem("guestId", data.guest.id);

      // Перенаправляем на главную страницу сайта
      router.push("/menu");
    } catch (err) {
      setError("Ошибка подключения к серверу");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FBF7EF] to-[#F0E3D0] px-6 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/menu" className="mb-8 block text-center font-serif text-4xl font-bold text-[#1F2421]">
          <span className="text-[#C8853F]">◐</span> ЛУНА
        </Link>

        <div className="overflow-hidden rounded-2xl border border-[#E2D9C8] bg-white p-8 shadow-lg">
          <div className="mb-6 flex gap-2">
            <button
              className={`flex-1 rounded-full px-6 py-3 font-medium transition ${
                mode === "login"
                  ? "bg-[#C8853F] text-white"
                  : "bg-[#F6F1E8] text-[#1F2421] hover:bg-[#F0E3D0]"
              }`}
              onClick={() => setMode("login")}
            >
              Вход
            </button>
            <button
              className={`flex-1 rounded-full px-6 py-3 font-medium transition ${
                mode === "register"
                  ? "bg-[#C8853F] text-white"
                  : "bg-[#F6F1E8] text-[#1F2421] hover:bg-[#F0E3D0]"
              }`}
              onClick={() => setMode("register")}
            >
              Регистрация
            </button>
          </div>

          <h1 className="mb-6 font-serif text-2xl font-bold text-[#1F2421]">
            {mode === "login" ? "Войти в личный кабинет" : "Создать аккаунт"}
          </h1>

          {error && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1F2421]">Имя</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-[#E2D9C8] bg-[#FBF7EF] p-3 text-[#1F2421] outline-none transition focus:border-[#C8853F] focus:ring-2 focus:ring-[#F0E3D0]"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Иван Иванов"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1F2421]">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-lg border border-[#E2D9C8] bg-[#FBF7EF] p-3 text-[#1F2421] outline-none transition focus:border-[#C8853F] focus:ring-2 focus:ring-[#F0E3D0]"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ivan@example.com"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2421]">Телефон</label>
              <input
                type="tel"
                required
                className="w-full rounded-lg border border-[#E2D9C8] bg-[#FBF7EF] p-3 text-[#1F2421] outline-none transition focus:border-[#C8853F] focus:ring-2 focus:ring-[#F0E3D0]"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+7 900 123-45-67"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2421]">Пароль</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full rounded-lg border border-[#E2D9C8] bg-[#FBF7EF] p-3 text-[#1F2421] outline-none transition focus:border-[#C8853F] focus:ring-2 focus:ring-[#F0E3D0]"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Минимум 6 символов"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#C8853F] px-6 py-3 font-medium text-white transition hover:bg-[#A86B2C] disabled:opacity-50"
            >
              {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#8A8A80]">
            {mode === "login" ? (
              <p>
                Нет аккаунта?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="font-medium text-[#C8853F] hover:underline"
                >
                  Зарегистрируйтесь
                </button>
              </p>
            ) : (
              <p>
                Уже есть аккаунт?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-medium text-[#C8853F] hover:underline"
                >
                  Войдите
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#8A8A80]">
          Регистрируясь, вы соглашаетесь с условиями <br />
          программы лояльности «Луна»
        </p>
      </div>
    </main>
  );
}
