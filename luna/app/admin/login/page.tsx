"use client";
import { useState } from "react";

const accounts = [["admin", "Администратор"], ["manager", "Управляющий"], ["cashier", "Кассир"], ["cook", "Повар"]];
export default function Login() {
  const [login, setLogin] = useState("admin"), [password, setPassword] = useState("admin"), [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ login, password }) });
    const data = await r.json();
    if (!r.ok) return setError(data.error);
    if (data.user) sessionStorage.setItem("luna-admin-user", JSON.stringify(data.user));
    window.location.assign("/admin");
  }
  return <main className="grid min-h-screen place-items-center bg-[#f5f7fa] p-5 text-[#1A1A1A]"><div className="grid w-full max-w-4xl gap-6 md:grid-cols-2"><form onSubmit={submit} className="panel p-7"><p className="accent text-4xl">◐</p><h1 className="mt-3 text-3xl font-bold">Вход в админ-панель</h1><p className="muted mt-2">Демо-авторизация с ролевым доступом</p><label className="mt-6 block text-sm">Логин<input className="mt-2 w-full rounded-lg border border-[#d7e0ea] bg-white p-3 text-[#1A1A1A]" value={login} onChange={e => setLogin(e.target.value)} /></label><label className="mt-3 block text-sm">Пароль<input className="mt-2 w-full rounded-lg border border-[#d7e0ea] bg-white p-3 text-[#1A1A1A]" type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <p className="mt-3 text-red-600">{error}</p>}<button className="btn mt-6 w-full">Войти</button></form><section className="panel p-7"><h2 className="text-xl font-bold">Тестовые аккаунты</h2><p className="muted mt-2 text-sm">Логин: <b>admin</b>, Пароль: <b>admin</b><br/>Логин: <b>cashier</b>, Пароль: <b>cashier</b></p>{accounts.map(([name, role]) => <button className="mt-3 flex w-full justify-between rounded-lg bg-[#eef3f8] p-3 text-left text-[#1A1A1A]" onClick={() => { setLogin(name); setPassword(name === "admin" ? "admin" : "cashier"); }} key={name}><span>{name}</span><span className="accent">{role}</span></button>)}</section></div></main>;
}
