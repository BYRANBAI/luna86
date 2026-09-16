"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/purity */
import { useEffect, useState } from "react";
import Link from "next/link";

type Any = any;

const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";

const formatTime = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}ч ${mins}мин`;
};

export default function POS() {
  const [data, setData] = useState<Any>({ items: [], orders: [], guests: [], categories: [] });
  const [table, setTable] = useState("");
  const [cart, setCart] = useState<Any[]>([]);
  const [guest, setGuest] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [payment, setPayment] = useState("Карта");
  const [receipt, setReceipt] = useState<Any>(null);
  const [split, setSplit] = useState(false);
  const [splitIds, setSplitIds] = useState<number[]>([]);
  const [splitBill, setSplitBill] = useState<Any[]>([]);
  const [menuQuery, setMenuQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState("Все");
  const [activeTab, setActiveTab] = useState<"tables" | "reservations" | "orders" | "queue">("tables");
  const [selectedReservation, setSelectedReservation] = useState<Any>(null);
  const [cookingTimers, setCookingTimers] = useState<Record<number, number>>({});
  const [guestSearch, setGuestSearch] = useState("");
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  const [pausedOrders, setPausedOrders] = useState<Record<string, Any[]>>({});
  const [currentPausedOrder, setCurrentPausedOrder] = useState<string | null>(null);
  const [tableOrdersCache, setTableOrdersCache] = useState<Record<string, { cart: Any[], guest: number, bonus: number }>>({});
  const [showTablesSection, setShowTablesSection] = useState(true);
  const [showBillSection, setShowBillSection] = useState(true);
  const [archivedOrders, setArchivedOrders] = useState<Any[]>([]);
  const [tabOrder, setTabOrder] = useState(["tables", "reservations", "orders", "queue"]);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const load = () => fetch("/api/state").then(r => r.json()).then(setData);
  
  useEffect(() => {
    document.title = "Луна · POS";
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, []);

  // Определение мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Таймеры готовки
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers: Record<number, number> = {};
      data.orders.forEach((order: Any) => {
        if (order.status === "COOKING" && order.createdAt) {
          const startTime = new Date(order.createdAt).getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 60000); // минуты
          const cookingTime = order.lines?.reduce((sum: number, line: Any) => {
            const item = data.items.find((i: Any) => i.id === line.itemId);
            return sum + (item?.cookingMinutes || 12);
          }, 0) || 12;
          newTimers[order.id] = Math.max(0, cookingTime - elapsed);
        }
      });
      setCookingTimers(newTimers);
    }, 1000);
    return () => clearInterval(interval);
  }, [data.orders, data.items]);

  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const due = Math.max(0, total - bonus);

  const add = (i: Any) => setCart(c => {
    const old = c.find(x => x.id === i.id);
    return old ? c.map(x => x.id === i.id ? { ...x, qty: x.qty + 1 } : x) : [...c, { ...i, qty: 1 }];
  });

  const remove = (id: number) => setCart(c => c.filter(x => x.id !== id));

  const updateQty = (id: number, delta: number) => setCart(c => {
    return c.map(x => {
      if (x.id === id) {
        const newQty = Math.max(0, x.qty + delta);
        return { ...x, qty: newQty };
      }
      return x;
    }).filter(x => x.qty > 0);
  });

  const checkout = async (lines = cart, splitMode = false) => {
    const lineTotal = lines.reduce((sum: number, x: Any) => sum + x.price * x.qty, 0);
    const lineBonus = Math.min(bonus, lineTotal);
    const lineDue = Math.max(0, lineTotal - lineBonus);
    
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "Зал",
        tableNumber: table,
        guestId: guest,
        bonus: lineBonus,
        paymentType: payment,
        payments: [
          ...(lineBonus ? [{ type: "Бонусы", amount: lineBonus }] : []),
          { type: payment.replace("Смешанная: бонусы + ", ""), amount: lineDue }
        ],
        lines: lines.map(x => ({ itemId: x.id, qty: x.qty }))
      })
    });
    
    const order = await r.json();
    if (!r.ok) return alert(order.error || "Не удалось оформить заказ");
    
    setReceipt({
      ...order,
      lines: lines.map(x => ({ ...x, price: x.price })),
      payments: [
        ...(lineBonus ? [{ type: "Бонусы", amount: lineBonus }] : []),
        { type: payment.replace("Смешанная: бонусы + ", ""), amount: lineDue }
      ],
      bonus: lineBonus
    });
    
    if (splitMode) {
      setSplitBill([]);
      setSplitIds([]);
    } else {
      setCart([]);
      setGuest(0);
      setBonus(0);
      // После успешной оплаты очищаем столик
      if (table) {
        const currentOrder = data.orders.find((o: Any) => 
          o.tableNumber === table && !['DONE', 'CANCELLED'].includes(o.status)
        );
        if (currentOrder) {
          try {
            await fetch("/api/orders", {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ id: currentOrder.id, status: "DONE", note: "Оплата завершена" })
            });
          } catch (error) {
            console.error("Failed to complete order:", error);
          }
        }
        setTable("");
      }
    }
    load();
  };

  const divide = () => {
    const chosen = cart.filter(x => splitIds.includes(x.id));
    if (!chosen.length) return alert("Выберите позиции во второй счёт");
    setSplitBill(chosen);
    setCart(cart.filter(x => !splitIds.includes(x.id)));
    setSplit(false);
  };

  const openTable = (t: string) => {
    // Сохраняем текущее состояние перед переключением
    if (table && cart.length > 0) {
      setTableOrdersCache(prev => ({
        ...prev,
        [table]: { cart: [...cart], guest, bonus }
      }));
    }
    
    setTable(t);
    
    // Проверяем есть ли кэшированный заказ для этого столика
    const cachedOrder = tableOrdersCache[t];
    if (cachedOrder) {
      setCart(cachedOrder.cart);
      setGuest(cachedOrder.guest);
      setBonus(cachedOrder.bonus);
    } else {
      const order = data.orders.find((x: Any) => 
        x.tableNumber === t && !['DONE', 'CANCELLED', 'DELIVERED'].includes(x.status)
      );
      if (order) {
        setCart(order.lines.map((line: Any) => ({ ...line.item, qty: line.qty })));
        setGuest(order.guestId || 0);
        setBonus(0);
      } else {
        setCart([]);
        setGuest(0);
        setBonus(0);
      }
    }
  };

  const closeTable = () => {
    setTable("");
    setCart([]);
    setGuest(0);
    setBonus(0);
  };

  const clearTable = async () => {
    if (!confirm("Освободить столик и завершить заказ?")) return;
    
    // Находим текущий заказ и обновляем его статус
    const currentOrder = data.orders.find((o: Any) => 
      o.tableNumber === table && !['DONE', 'CANCELLED', 'DELIVERED'].includes(o.status)
    );
    
    if (currentOrder) {
      try {
        await fetch("/api/orders", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: currentOrder.id, status: "DONE", note: "Столик освобождён" })
        });
      } catch (error) {
        console.error("Failed to clear table:", error);
        alert("Не удалось освободить столик");
      }
    }
    
    closeTable();
    load();
  };

  const cancelOrder = async () => {
    if (!confirm("Отменить текущий заказ? Это действие нельзя отменить.")) return;
    
    const currentOrder = data.orders.find((o: Any) => 
      o.tableNumber === table && !['DONE', 'CANCELLED', 'DELIVERED'].includes(o.status)
    );
    
    if (currentOrder) {
      try {
        await fetch("/api/orders", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: currentOrder.id, status: "CANCELLED", note: "Заказ отменён" })
        });
      } catch (error) {
        console.error("Failed to cancel order:", error);
        alert("Не удалось отменить заказ");
      }
    }
    
    closeTable();
    load();
  };

  const getTableInfo = (tableNum: string) => {
    const order = data.orders.find((x: Any) => 
      x.tableNumber === tableNum && !['DONE', 'CANCELLED', 'DELIVERED'].includes(x.status)
    );
    
    if (!order) return { status: "свободен", occupied: false, total: 0, startTime: null, guests: 0 };
    
    const isReady = order.status === "READY";
    const isPaymentPending = order.status === "PAYMENT_PENDING";
    
    return {
      status: isReady ? "готов" : isPaymentPending ? "ожидает оплаты" : "занят",
      occupied: true,
      total: order.total,
      startTime: order.createdAt,
      guests: order.lines?.reduce((sum: number, line: Any) => sum + line.qty, 0) || 0,
      orderId: order.id,
      orderStatus: order.status
    };
  };

  const tables = ["1", "2", "3", "4", "5", "6", "7", "8"];

  const createReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    // Здесь можно добавить создание брони через API
    alert("Функция создания брони будет добавлена");
  };

  const addToQueue = async () => {
    // Функция добавления в электронную очередь
    alert("Функция добавления в очередь будет добавлена");
  };

  const removeFromQueue = async (id: number) => {
    // Функция удаления из очереди
    alert("Функция удаления из очереди будет добавлена");
  };

  const markQueueReady = async (id: number) => {
    // Функция отметки "Готово" в очереди
    alert("Функция отметки готовности будет добавлена");
  };

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetTab: string) => {
    e.preventDefault();
    if (!draggedTab || draggedTab === targetTab) return;

    const newOrder = [...tabOrder];
    const draggedIndex = newOrder.indexOf(draggedTab);
    const targetIndex = newOrder.indexOf(targetTab);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedTab);

    setTabOrder(newOrder);
    setDraggedTab(null);
  };

  const markDishServed = async (tableNumber: string) => {
    // Отметить что блюдо подано
    const currentOrder = data.orders.find((o: Any) => 
      o.tableNumber === tableNumber && o.status === "READY"
    );
    
    if (currentOrder) {
      try {
        await fetch("/api/orders", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: currentOrder.id, status: "DELIVERED", note: "Блюдо подано" })
        });
        load();
      } catch (error) {
        console.error("Failed to mark dish as served:", error);
        alert("Не удалось отметить блюдо как поданное");
      }
    }
  };

  const clearCompletedOrders = async () => {
    // Очистить завершённые заказы из ленты и сохранить в корзину
    if (!confirm("Убрать все готовые и доставленные заказы из ленты? Они сохранятся в корзину для восстановления.")) return;
    
    const completedOrders = data.orders.filter((o: Any) => 
      ['READY', 'DELIVERED', 'DONE'].includes(o.status)
    );
    
    // Сохраняем в корзину
    const archivedWithItems = completedOrders.map((order: Any) => ({
      ...order,
      items: order.lines?.map((line: Any) => ({
        ...line.item,
        qty: line.qty
      })) || []
    }));
    
    setArchivedOrders(prev => [...prev, ...archivedWithItems]);
    
    // Архивируем в базе
    for (const order of completedOrders) {
      try {
        await fetch("/api/orders", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: order.id, status: "ARCHIVED", note: "Убран из ленты" })
        });
      } catch (error) {
        console.error("Failed to archive order:", error);
      }
    }
    
    load();
  };

  const restoreOrder = (archivedOrder: Any) => {
    // Восстановить заказ из архива в корзину
    if (!confirm(`Восстановить заказ №${archivedOrder.number} в корзину?`)) return;
    
    const restoredItems = archivedOrder.items || [];
    setCart(restoredItems);
    
    // Удаляем из архива
    setArchivedOrders(prev => prev.filter(o => o.id !== archivedOrder.id));
    
    alert(`Заказ №${archivedOrder.number} восстановлен в корзине`);
  };

  const orderToCart = (order: Any) => {
    // Перенести заказ в корзину
    const items = order.lines?.map((line: Any) => ({
      ...line.item,
      qty: line.qty
    })) || [];
    
    setCart(items);
    setTable(order.tableNumber || "quick");
    setGuest(order.guestId || 0);
    
    alert(`Заказ №${order.number} добавлен в корзину`);
  };

  const changeOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus, note: `Статус изменён на ${newStatus}` })
      });
      load();
    } catch (error) {
      console.error("Failed to change order status:", error);
      alert("Не удалось изменить статус");
    }
  };

  const deleteOrder = async (orderId: number) => {
    if (!confirm("Удалить заказ навсегда?")) return;
    
    try {
      await fetch("/api/orders", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: orderId })
      });
      load();
    } catch (error) {
      console.error("Failed to delete order:", error);
      alert("Не удалось удалить заказ");
    }
  };

  const createGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    // Функция создания нового гостя
    alert("Функция создания гостя будет добавлена");
  };

  const pauseOrder = () => {
    if (!table || cart.length === 0) return;
    
    // Сохраняем текущий заказ
    const orderKey = table;
    setPausedOrders(prev => ({
      ...prev,
      [orderKey]: [...cart]
    }));
    
    // Очищаем текущий заказ
    setCart([]);
    setGuest(0);
    setBonus(0);
    setCurrentPausedOrder(orderKey);
    
    alert(`Заказ для стола ${table} сохранён на паузе`);
  };

  const resumeOrder = (orderKey: string) => {
    const savedCart = pausedOrders[orderKey];
    if (savedCart && savedCart.length > 0) {
      setCart(savedCart);
      setTable(orderKey);
      setCurrentPausedOrder(null);
      
      // Удаляем из приостановленных
      setPausedOrders(prev => {
        const newPaused = { ...prev };
        delete newPaused[orderKey];
        return newPaused;
      });
    }
  };

  const quickOrder = () => {
    // Сохраняем текущее состояние
    if (table && cart.length > 0) {
      setTableOrdersCache(prev => ({
        ...prev,
        [table]: { cart: [...cart], guest, bonus }
      }));
    }
    
    // Быстрый заказ без привязки к столику
    setTable("quick");
    setCart([]);
    setGuest(0);
    setBonus(0);
    setActiveTab("tables");
  };

  return (
    <main className={`mx-auto ${isMobile ? 'px-4 py-4' : 'px-6 py-7'}`}>
      <header className="mb-6 flex items-center justify-between">
        <Link className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} href="/">
          <span className="accent">◐</span> ЛУНА · POS
        </Link>
        <nav className={`flex gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {[
            ["menu", "Меню"],
            ["crm", "CRM"],
            ["kds", "KDS"],
            ["queue", "Очередь"]
          ].map(([x, n]) => (
            <Link className={`btn secondary ${isMobile ? 'px-2 py-1' : 'px-3 py-2'}`} href={"/" + x} key={x}>{n}</Link>
          ))}
        </nav>
      </header>

      {/* Вкладки */}
      <div className="mb-6 flex gap-2 border-b border-[#30425a] pb-2 overflow-x-auto">
        {tabOrder.map((tabId) => {
          const tabConfig: Record<string, { label: string, icon: string }> = {
            tables: { label: "Столики", icon: "🪑" },
            reservations: { label: "Брони", icon: "📅" },
            orders: { label: "Заказы и очередь", icon: "�" }
          };
          const tab = tabConfig[tabId];
          if (!tab) return null;
          
          return (
            <button
              key={tabId}
              draggable
              onDragStart={(e) => handleDragStart(e, tabId)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tabId)}
              className={`px-4 py-2 rounded-lg cursor-move ${activeTab === tabId ? "bg-[#6b493a]" : "bg-[#193653]"}`}
              onClick={() => setActiveTab(tabId as any)}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
        <button
          className="px-4 py-2 rounded-lg bg-[#2d5a3d]"
          onClick={quickOrder}
        >
          ⚡ Быстрый заказ
        </button>
      </div>

      {/* Приостановленные заказы */}
      {Object.keys(pausedOrders).length > 0 && (
        <section className="panel mb-6 p-4 bg-[#1a2f4a]">
          <h3 className="text-lg font-bold mb-3">⏸ Приостановленные заказы</h3>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(pausedOrders).map(([orderKey, savedCart]) => (
              <button
                key={orderKey}
                className="btn secondary text-sm px-3 py-2"
                onClick={() => resumeOrder(orderKey)}
              >
                Стол {orderKey} ({savedCart.length} позиций)
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Архивированные заказы */}
      {archivedOrders.length > 0 && (
        <section className="panel mb-6 p-4 bg-[#1a2f4a]">
          <h3 className="text-lg font-bold mb-3">📦 Архивированные заказы</h3>
          <div className="flex gap-2 flex-wrap">
            {archivedOrders.map((order: Any) => (
              <button
                key={order.id}
                className="btn secondary text-sm px-3 py-2"
                onClick={() => restoreOrder(order)}
              >
                №{order.number} ({order.items?.length || 0} позиций) · {money(order.total)}
              </button>
            ))}
          </div>
        </section>
      )}

      {activeTab === "tables" && (
        <>
          <section className="panel mb-6 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Схема зала</h2>
              <button 
                className="btn secondary text-sm"
                onClick={() => setShowTablesSection(!showTablesSection)}
              >
                {showTablesSection ? "🔽 Свернуть" : "🔽 Развернуть"}
              </button>
            </div>
            
            {showTablesSection && (
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
              {tables.map(t => {
                const info = getTableInfo(t);
                const isSelected = table === t;
                const isReady = info.orderStatus === "READY";
                const isCooking = info.orderStatus === "COOKING";
                const isDelivered = info.orderStatus === "DELIVERED";
                const elapsed = info.startTime ? Math.floor((Date.now() - new Date(info.startTime).getTime()) / 60000) : 0;
                
                // Цветовая индикация статусов
                let bgColor = "bg-[#193653]"; // Синий - свободен
                let statusIcon = "";
                
                if (isSelected) {
                  bgColor = "bg-[#6b493a] ring-2 ring-[#d8b45b]"; // Выбран
                } else if (isDelivered) {
                  bgColor = "bg-[#3d5a3d]"; // Тёмно-зелёный - блюдо подано
                  statusIcon = "🍽";
                } else if (isReady) {
                  bgColor = "bg-[#2d5a3d]"; // Зелёный - готов к подаче
                  statusIcon = "✓";
                } else if (isCooking) {
                  bgColor = "bg-[#6b493a]"; // Жёлтый/коричневый - готовится
                  statusIcon = "⏱";
                } else if (info.occupied) {
                  bgColor = "bg-[#6b493a]"; // Коричневый - занят
                }
                
                return (
                  <button
                    key={t}
                    onClick={() => isSelected ? closeTable() : openTable(t)}
                    className={`rounded-xl p-4 transition-all ${bgColor} hover:opacity-80`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">Стол {t}</span>
                      {statusIcon && <span className="text-2xl">{statusIcon}</span>}
                    </div>
                    <small className="muted block mt-1">{info.status}</small>
                    
                    {isReady && (
                      <button
                        className="mt-2 w-full btn bg-green-600 text-xs py-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          markDishServed(t);
                        }}
                      >
                        ✓ Блюдо подано
                      </button>
                    )}
                    {info.occupied && (
                      <div className="mt-2 text-xs">
                        <div className="flex justify-between">
                          <span>Чек:</span>
                          <span className="font-bold">{money(info.total)}</span>
                        </div>
                        {info.startTime && (
                          <div className="flex justify-between">
                            <span>Время:</span>
                            <span>{formatDuration(elapsed)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Гостей:</span>
                          <span>{info.guests}</span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
              </div>
            )}
          </section>

          {table && (
            <section className="panel mb-6 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Стол {table} · меню</h2>
                <div className="flex gap-2">
                  {cart.length > 0 && (
                    <button onClick={pauseOrder} className="btn secondary text-sm text-blue-400">
                      ⏸ Пауза
                    </button>
                  )}
                  <button onClick={cancelOrder} className="btn secondary text-sm text-red-400">
                    ❌ Отменить
                  </button>
                  <button onClick={clearTable} className="btn secondary text-sm text-yellow-400">
                    🗑 Освободить
                  </button>
                  <button onClick={closeTable} className="btn secondary text-sm">
                    ✕ Закрыть
                  </button>
                </div>
              </div>
              
              {/* Категории */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === null ? "bg-[#d8b45b] text-black" : "bg-[#193653]"
                  }`}
                  onClick={() => setSelectedCategory(null)}
                >
                  Все
                </button>
                {(data.categories || []).map((cat: Any) => (
                  <button
                    key={cat.id}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                      selectedCategory === cat.id ? "bg-[#d8b45b] text-black" : "bg-[#193653]"
                    }`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <input
                className="w-full rounded-lg bg-[#15263c] p-3"
                placeholder="Поиск блюда"
                onChange={e => setMenuQuery(e.target.value)}
              />
              
              <div className={`mt-3 grid gap-2 max-h-[500px] overflow-y-auto ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {data.items
                  .filter((i: Any) => {
                    const matchesCategory = selectedCategory === null || i.categoryId === selectedCategory;
                    const matchesSearch = i.name.toLowerCase().includes(menuQuery.toLowerCase());
                    const inStock = i.stock > 0;
                    return matchesCategory && matchesSearch && inStock;
                  })
                  .map((i: Any) => (
                    <button
                      className="btn secondary text-left p-3 hover:bg-[#2a3f5a]"
                      onClick={() => add(i)}
                      key={i.id}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{i.name}</span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-[#d8b45b]">{money(i.price)}</span>
                          {i.cookingMinutes && (
                            <small className="muted text-xs">⏱ {i.cookingMinutes} мин</small>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>

              <div className="mt-6 border-t border-[#30425a] pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Счёт</h2>
                  <button
                    className="btn secondary text-sm"
                    onClick={() => setShowBillSection(!showBillSection)}
                  >
                    {showBillSection ? "🔽 Свернуть" : "🔽 Развернуть"}
                  </button>
                </div>

                {showBillSection && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      {/* Статус текущего заказа */}
                      {(() => {
                        const currentOrder = data.orders.find((o: Any) => 
                          o.tableNumber === table && !['DONE', 'CANCELLED', 'DELIVERED'].includes(o.status)
                        );
                        if (currentOrder) {
                          const isReady = currentOrder.status === "READY";
                          const isCooking = currentOrder.status === "COOKING";
                          const timer = cookingTimers[currentOrder.id];
                          
                          return (
                            <div className={`px-3 py-1 rounded-full text-sm ${
                              isReady ? "bg-green-600" : isCooking ? "bg-yellow-600" : "bg-blue-600"
                            }`}>
                              {isReady ? "✓ Готов к подаче" : 
                               isCooking ? `⏱ Готовится${timer ? ` (${timer} мин)` : ''}` : 
                               "📝 В ожидании"}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {cart.map(x => (
                        <div className="flex justify-between items-center border-b border-[#30425a] py-2" key={x.id}>
                          <div className="flex-1">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={splitIds.includes(x.id)}
                                onChange={() => setSplitIds(v => 
                                  v.includes(x.id) ? v.filter(id => id !== x.id) : [...v, x.id]
                                )}
                              />
                              {x.name}
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              className="btn secondary text-xs px-2 py-1"
                              onClick={() => updateQty(x.id, -1)}
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{x.qty}</span>
                            <button 
                              className="btn secondary text-xs px-2 py-1"
                              onClick={() => updateQty(x.id, 1)}
                            >
                              +
                            </button>
                            <span className="ml-2 font-bold">{money(x.price * x.qty)}</span>
                            <button 
                              className="btn secondary text-xs ml-2"
                              onClick={() => remove(x.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between text-xl items-center pt-4 border-t border-[#30425a]">
                      <span>К оплате</span>
                      <b className="accent">{money(due)}</b>
                    </div>
                    
                    <div className="mt-4">
                      <div className="mt-3">
                        <div className="flex gap-2 mb-2">
                          <input
                            className="flex-1 rounded-lg bg-[#15263c] p-3"
                            placeholder="Поиск гостя по номеру"
                            value={guestSearch}
                            onChange={e => setGuestSearch(e.target.value)}
                          />
                          <button 
                            className="btn px-3"
                            onClick={() => setShowNewGuestForm(true)}
                          >
                            +
                          </button>
                        </div>
                        <select
                          className="w-full rounded-lg bg-[#15263c] p-3"
                          value={guest}
                          onChange={e => setGuest(Number(e.target.value))}
                        >
                          <option value={0}>Без гостя</option>
                          {data.guests
                            .filter((g: Any) => !guestSearch || g.phone.includes(guestSearch) || g.name.toLowerCase().includes(guestSearch.toLowerCase()))
                            .map((g: Any) => (
                              <option key={g.id} value={g.id}>
                                {g.name} · {g.phone} · {g.bonuses} бонусов
                              </option>
                            ))}
                        </select>
                      </div>
                      
                      <input
                        className="mt-3 w-full rounded-lg bg-[#15263c] p-3"
                        type="number"
                        min="0"
                        max={data.guests.find((g: Any) => g.id === guest)?.bonuses || 0}
                        value={bonus}
                        onChange={e => setBonus(Number(e.target.value))}
                        placeholder="Бонусы"
                      />
                      
                      <select
                        className="mt-3 w-full rounded-lg bg-[#15263c] p-3"
                        value={payment}
                        onChange={e => setPayment(e.target.value)}
                      >
                        <option>Наличные</option>
                        <option>Карта</option>
                        <option>QR/СБП</option>
                        <option>Смешанная: бонусы + карта</option>
                      </select>
                      
                      <div className="mt-3 flex gap-2">
                        <button
                          className="btn secondary flex-1"
                          onClick={() => { setSplit(!split); divide(); }}
                        >
                          Разделить
                        </button>
                        <button
                          className="btn flex-1"
                          disabled={!cart.length}
                          onClick={() => checkout()}
                        >
                          Оплатить
                        </button>
                      </div>
                      
                      {splitBill.length > 0 && (
                        <div className="mt-4 rounded-xl bg-[#182a42] p-3">
                          <b>Второй счёт</b>
                          {splitBill.map(x => (
                            <p className="flex justify-between text-sm" key={x.id}>
                              {x.name} × {x.qty}
                              <span>{money(x.price * x.qty)}</span>
                            </p>
                          ))}
                          <button
                            className="btn mt-3 w-full"
                            onClick={() => checkout(splitBill, true)}
                          >
                            Оплатить второй счёт
                          </button>
                        </div>
                      )}
                      
                      {split && (
                        <p className="muted mt-3 text-sm">
                          Отметьте позиции чекбоксами и нажмите «Разделить».
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {activeTab === "reservations" && (
        <section className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Брони</h2>
            <button 
              className="btn"
              onClick={() => setSelectedReservation({})}
            >
              + Новая бронь
            </button>
          </div>
          
          {(data.reservations || []).map((r: Any) => (
            <div className="border-b border-[#30425a] py-3" key={r.id}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{new Date(r.date).toLocaleString("ru-RU")}</p>
                  <p className="text-sm">{r.guestName} · стол {r.table?.number ?? "любой"}</p>
                  <p className="text-sm muted">Гостей: {r.guests} · {r.note}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    r.status === "Новая" ? "bg-blue-600" :
                    r.status === "Подтверждена" ? "bg-green-600" :
                    r.status === "Занята" ? "bg-yellow-600" :
                    "bg-gray-600"
                  }`}>
                    {r.status}
                  </span>
                  <div className="mt-2 flex gap-2">
                    <button className="btn secondary text-xs">Подтвердить</button>
                    <button className="btn secondary text-xs">Отменить</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {showNewGuestForm && (
            <div className="fixed inset-0 grid place-items-center bg-black/70 p-5">
              <div className="w-full max-w-md rounded-xl bg-[#1a2f4a] p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Новый гость</h3>
                  <button onClick={() => setShowNewGuestForm(false)} className="text-2xl">×</button>
                </div>
                <form onSubmit={createGuest}>
                  <input
                    className="w-full rounded-lg bg-[#15263c] p-3 mb-3"
                    placeholder="Имя"
                    required
                  />
                  <input
                    className="w-full rounded-lg bg-[#15263c] p-3 mb-3"
                    type="tel"
                    placeholder="Номер телефона"
                    required
                  />
                  <button type="submit" className="btn w-full">Создать гостя</button>
                </form>
              </div>
            </div>
          )}

          {selectedReservation !== null && (
            <div className="fixed inset-0 grid place-items-center bg-black/70 p-5">
              <div className="w-full max-w-md rounded-xl bg-[#1a2f4a] p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Новая бронь</h3>
                  <button onClick={() => setSelectedReservation(null)} className="text-2xl">×</button>
                </div>
                <form onSubmit={createReservation}>
                  <input
                    className="w-full rounded-lg bg-[#15263c] p-3 mb-3"
                    placeholder="Имя гостя"
                    required
                  />
                  <input
                    className="w-full rounded-lg bg-[#15263c] p-3 mb-3"
                    type="datetime-local"
                    required
                  />
                  <input
                    className="w-full rounded-lg bg-[#15263c] p-3 mb-3"
                    type="number"
                    placeholder="Количество гостей"
                    min="1"
                    required
                  />
                  <select className="w-full rounded-lg bg-[#15263c] p-3 mb-3">
                    <option value="">Любой стол</option>
                    {tables.map(t => (
                      <option key={t} value={t}>Стол {t}</option>
                    ))}
                  </select>
                  <textarea
                    className="w-full rounded-lg bg-[#15263c] p-3 mb-3"
                    placeholder="Примечание"
                    rows={3}
                  />
                  <button type="submit" className="btn w-full">Создать бронь</button>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "queue" && (
        <section className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Электронная очередь</h2>
            <button 
              className="btn"
              onClick={addToQueue}
            >
              + Добавить в очередь
            </button>
          </div>
          
          <div className="grid gap-3">
            {/* Имитация очереди - в реальности будет приходить из API */}
            <div className="border-b border-[#30425a] py-3 flex justify-between items-center">
              <div>
                <p className="font-bold">№1 - Алексей Иванов</p>
                <p className="text-sm muted">Прибыл: 10:30 · 2 человека</p>
              </div>
              <div className="flex gap-2">
                <button 
                  className="btn bg-green-600 text-xs"
                  onClick={() => markQueueReady(1)}
                >
                  ✓ Готово
                </button>
                <button 
                  className="btn secondary text-xs"
                  onClick={() => removeFromQueue(1)}
                >
                  ✕ Удалить
                </button>
              </div>
            </div>
            
            <div className="border-b border-[#30425a] py-3 flex justify-between items-center">
              <div>
                <p className="font-bold">№2 - Мария Петрова</p>
                <p className="text-sm muted">Прибыла: 10:35 · 4 человека</p>
              </div>
              <div className="flex gap-2">
                <button 
                  className="btn bg-green-600 text-xs"
                  onClick={() => markQueueReady(2)}
                >
                  ✓ Готово
                </button>
                <button 
                  className="btn secondary text-xs"
                  onClick={() => removeFromQueue(2)}
                >
                  ✕ Удалить
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "orders" && (
        <section className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Лента заказов</h2>
            <div className="flex gap-2">
              <select
                className="rounded bg-[#15263c] p-2"
                value={feedFilter}
                onChange={e => setFeedFilter(e.target.value)}
              >
                <option>Все</option>
                <option>Сайт</option>
                <option>Киоск</option>
                <option>Зал</option>
                <option>Доставка</option>
              </select>
              <button 
                className="btn secondary text-sm"
                onClick={clearCompletedOrders}
              >
                🗑 Очистить готовые
              </button>
            </div>
          </div>
          
          {data.orders
            .filter((o: Any) => !['DONE', 'ARCHIVED'].includes(o.status) && (feedFilter === "Все" || o.source === feedFilter))
            .map((o: Any) => {
              const timer = cookingTimers[o.id];
              const isReady = o.status === "READY";
              const isCooking = o.status === "COOKING";
              
              return (
                <div className="border-b border-[#30425a] py-3" key={o.id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">№ {o.number}</span>
                        <span className="text-sm muted">{o.source}</span>
                        {o.tableNumber && <span className="text-sm muted">· стол {o.tableNumber}</span>}
                      </div>
                      <p className="text-sm mt-1">
                        {(o.lines || []).map((l: Any) => `${l.item?.name || l.name} × ${l.qty}`).join(", ")}
                      </p>
                      {isCooking && timer !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">⏱ Готовность:</span>
                            <div className="flex-1 bg-[#15263c] rounded-full h-2">
                              <div 
                                className="bg-[#d8b45b] h-2 rounded-full transition-all"
                                style={{ width: `${Math.max(0, 100 - (timer / 12) * 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold">{timer} мин</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs mb-2 ${
                        isReady ? "bg-green-600" :
                        isCooking ? "bg-yellow-600" :
                        o.status === "NEW" ? "bg-blue-600" :
                        "bg-gray-600"
                      }`}>
                        {({
                          NEW: "Новый",
                          COOKING: "Готовится",
                          READY: "Готов",
                          DONE: "Выдан",
                          DELIVERY_ASSIGNED: "Курьер назначен",
                          IN_DELIVERY: "В доставке",
                          DELIVERED: "Доставлен",
                          CANCELLED: "Отменён"
                        } as Any)[o.status] || o.status}
                      </span>
                      <div className="font-bold">{money(o.total)}</div>
                      <button 
                        className="btn secondary text-xs mt-2"
                        onClick={() => setReceipt(o)}
                      >
                        Печать чека
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </section>
      )}

      {receipt && (
        <div className="fixed inset-0 grid place-items-center bg-black/70 p-5">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-black">
            <div className="flex justify-between">
              <b>КАФЕ «ЛУНА»</b>
              <button onClick={() => setReceipt(null)}>×</button>
            </div>
            <p>Заказ №{receipt.number} · {new Date(receipt.createdAt || Date.now()).toLocaleString("ru-RU")}</p>
            <p>{receipt.source}{receipt.tableNumber ? ` · стол ${receipt.tableNumber}` : ""}</p>
            <hr className="my-3"/>
            {(receipt.lines || []).map((l: Any) => (
              <p className="flex justify-between" key={l.id || l.itemId}>
                <span>{l.item?.name || l.name} × {l.qty}</span>
                <span>{money(l.price * l.qty)}</span>
              </p>
            ))}
            <hr className="my-3"/>
            <p className="flex justify-between font-bold">
              <span>Итого</span>
              <span>{money(receipt.total || receipt.lines?.reduce((s: number, l: Any) => s + l.price * l.qty, 0) || 0)}</span>
            </p>
            <p>Оплата: {(receipt.payments || []).map((p: Any) => `${p.type} ${money(p.amount)}`).join(", ") || payment}</p>
            <p>Бонусы списано: {receipt.bonus || 0} · начислено: {Math.floor((receipt.total || 0) * .05)}</p>
            <small>ФН 9999078900000000 · ФД 1234 · ФПД 567890<br/>QR: [|||||||||||||]</small>
          </div>
        </div>
      )}
    </main>
  );
}