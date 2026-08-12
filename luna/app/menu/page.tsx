"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Item {
  id: number;
  name: string;
  description: string;
  price: number;
  photo: string;
  categoryId: number;
  labels: string;
  calories?: number;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Guest {
  id: number;
  name: string;
  bonuses: number;
}

export default function MenuPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<{ itemId: number; qty: number; price: number }[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
    loadGuest();
    loadCart();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, itemsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/items"),
      ]);
      const cats = await catRes.json();
      const its = await itemsRes.json();
      setCategories(cats.filter((c: Category) => c.name));
      setItems(its.filter((i: Item) => i.name));
    } catch (error) {
      console.error("Ошибка загрузки меню:", error);
    }
  };

  const loadGuest = () => {
    const token = localStorage.getItem("guestToken");
    const guestId = localStorage.getItem("guestId");
    if (token && guestId) {
      fetch(`/api/guests/${guestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(setGuest)
        .catch(() => {});
    }
  };

  const loadCart = () => {
    const saved = localStorage.getItem("cart");
    if (saved) setCart(JSON.parse(saved));
  };

  const saveCart = (newCart: typeof cart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const addToCart = (item: Item) => {
    const existing = cart.find((c) => c.itemId === item.id);
    if (existing) {
      saveCart(
        cart.map((c) =>
          c.itemId === item.id ? { ...c, qty: c.qty + 1 } : c
        )
      );
    } else {
      saveCart([...cart, { itemId: item.id, qty: 1, price: item.price }]);
    }
  };

  const removeFromCart = (itemId: number) => {
    const existing = cart.find((c) => c.itemId === itemId);
    if (existing && existing.qty > 1) {
      saveCart(
        cart.map((c) =>
          c.itemId === itemId ? { ...c, qty: c.qty - 1 } : c
        )
      );
    } else {
      saveCart(cart.filter((c) => c.itemId !== itemId));
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === null || item.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  return (
    <main className="min-h-screen bg-[#F6F1E8]">
      {/* Навигация */}
      <nav className="sticky top-0 z-50 border-b border-[#E2D9C8] bg-[#FBF7EF]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-[#C8853F]">◐</span> ЛУНА
          </Link>

          <div className="flex items-center gap-4">
            {guest ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-[#1F2421]">{guest.name}</div>
                  <div className="text-xs text-[#8A8A80]">
                    {guest.bonuses} бонусов
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="rounded-full bg-[#C8853F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#A86B2C]"
                >
                  Профиль
                </Link>
              </div>
            ) : (
              <Link
                href="/auth"
                className="rounded-full border border-[#C8853F] px-4 py-2 text-sm font-medium text-[#C8853F] transition hover:bg-[#F0E3D0]"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Герой */}
      <section className="border-b border-[#E2D9C8] bg-gradient-to-br from-[#FBF7EF] to-[#F0E3D0] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-3 inline-block rounded-full bg-[#F0E3D0] px-4 py-1 text-xs font-medium text-[#C8853F]">
            Доставка за 45 минут
          </div>
          <h1 className="mb-4 font-serif text-5xl font-bold leading-tight text-[#1F2421]">
            Доставка <span className="italic text-[#C8853F]">вкуса</span>
            <br />
            прямо к вашей двери
          </h1>
          <p className="mb-8 max-w-xl text-lg text-[#8A8A80]">
            Пицца, роллы, кавказская кухня, десерты и кофе. Закажите онлайн и получите бонусы.
          </p>

          {/* Поиск */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Поиск по меню..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-[#E2D9C8] bg-white px-6 py-3 pr-12 text-[#1F2421] outline-none transition focus:border-[#C8853F] focus:ring-2 focus:ring-[#F0E3D0]"
            />
            <svg
              className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A8A80]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Категории */}
      <section className="sticky top-[73px] z-40 border-b border-[#E2D9C8] bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedCategory === null
                  ? "bg-[#C8853F] text-white"
                  : "bg-[#F6F1E8] text-[#1F2421] hover:bg-[#F0E3D0]"
              }`}
            >
              Все
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === cat.id
                    ? "bg-[#C8853F] text-white"
                    : "bg-[#F6F1E8] text-[#1F2421] hover:bg-[#F0E3D0]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Меню */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const inCart = cart.find((c) => c.itemId === item.id);
              const hasNew = item.labels.includes("new");
              const hasHit = item.labels.includes("hit");
              const hasSpicy = item.labels.includes("spicy");

              return (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-[#E2D9C8] bg-white shadow-sm transition hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#F6F1E8]">
                    {item.photo && (
                      <img
                        src={item.photo}
                        alt={item.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    )}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      {hasNew && (
                        <span className="rounded-full bg-[#C8853F] px-3 py-1 text-xs font-medium text-white">
                          Новинка
                        </span>
                      )}
                      {hasHit && (
                        <span className="rounded-full bg-[#2A2723] px-3 py-1 text-xs font-medium text-white">
                          Хит
                        </span>
                      )}
                      {hasSpicy && <span className="text-xl">🌶️</span>}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="mb-2 font-serif text-xl font-bold text-[#1F2421]">
                      {item.name}
                    </h3>
                    <p className="mb-3 text-sm text-[#8A8A80] line-clamp-2">
                      {item.description}
                    </p>

                    {item.calories && (
                      <p className="mb-3 text-xs text-[#8A8A80]">
                        {item.calories} ккал
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-serif text-2xl font-bold text-[#1F2421]">
                        {item.price} ₽
                      </span>

                      {inCart ? (
                        <div className="flex items-center gap-2 rounded-full bg-[#F0E3D0] px-2 py-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#C8853F] transition hover:bg-[#FBF7EF]"
                          >
                            −
                          </button>
                          <span className="min-w-[20px] text-center font-medium text-[#1F2421]">
                            {inCart.qty}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C8853F] text-white transition hover:bg-[#A86B2C]"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="rounded-full bg-[#C8853F] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#A86B2C] hover:shadow-md"
                        >
                          В корзину
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-xl text-[#8A8A80]">
                {searchQuery ? "Ничего не найдено" : "Меню загружается..."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Плавающая корзина */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <button
            onClick={() => router.push("/checkout")}
            className="flex items-center gap-4 rounded-full bg-[#C8853F] px-8 py-4 font-medium text-white shadow-2xl transition hover:bg-[#A86B2C] hover:shadow-xl"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              {cartCount}
            </span>
            <span className="font-serif text-lg">Корзина</span>
            <span className="font-serif text-lg font-bold">{cartTotal} ₽</span>
          </button>
        </div>
      )}
    </main>
  );
}
