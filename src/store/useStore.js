import { createContext, createElement, useContext, useEffect, useState } from "react";
import { seed, menuCategories, defaultMenuProducts, purchaseOrderStatusOptions } from "./seed";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "serjesData";
const SESSION_KEY = "serjesSession";
const ACTIVE_PAGE_KEY = "serjesActivePage";
const StoreContext = createContext(null);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(n) {
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function normalize(data) {
  if (!Array.isArray(data.products)) data.products = [];
  const existingNames = new Set(data.products.map((p) => String(p.name || "").trim().toLowerCase()));
  defaultMenuProducts.forEach((product) => {
    const key = String(product.name || "").trim().toLowerCase();
    if (!existingNames.has(key)) {
      data.products.push({ ...product, id: Date.now() + Math.random() });
      existingNames.add(key);
    }
  });
  data.products.forEach((product) => {
    if (!menuCategories.includes(product.category))
      product.category = product.name === "Croissant" ? "Extras" : "Hot Coffee";
    if (product.visibleInMenu === undefined) product.visibleInMenu = true;
    if (product.inventoryManaged === undefined) product.inventoryManaged = true;
    if (product.stock === undefined) product.stock = 0;
    if (product.cost === undefined) product.cost = 0;
  });
  data.calendarNotes = data.calendarNotes || {};
  data.purchaseOrders = Array.isArray(data.purchaseOrders) ? data.purchaseOrders : (seed.purchaseOrders || []);
  data.staff = data.staff || seed.staff;
  data.staff.forEach((s) => {
    if (!s.password) s.password = s.username === "admin" ? "admin123" : "staff123";
  });
  return data;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) {
    console.warn("Failed to load data, using seed", e);
  }
  return normalize(JSON.parse(JSON.stringify(seed)));
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save data", e);
  }
}

function toDatabaseRows(data) {
  return {
    products: data.products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      visible_in_menu: product.visibleInMenu !== false,
      inventory_managed: product.inventoryManaged !== false,
    })),
    staff: data.staff.map((member) => ({
      id: member.id,
      username: member.username,
      password: member.password,
      role: member.role,
    })),
    sales: data.sales.map((sale) => ({
      id: sale.id,
      order_id: sale.orderId || null,
      customer: sale.customer || null,
      payment_method: sale.paymentMethod || "Cash",
      sale_date: sale.date,
      sale_time: sale.time,
      staff: sale.staff,
      product: sale.product,
      qty: sale.qty,
      total: sale.total,
      cost: sale.cost,
    })),
    purchaseOrders: data.purchaseOrders.map((order) => ({
      id: order.id,
      product_id: order.productId,
      product: order.product,
      quantity: order.quantity,
      unit_cost: order.unitCost,
      total_cost: order.totalCost,
      staff: order.staff,
      order_date: order.date,
      status: order.status,
    })),
    calendarNotes: Object.entries(data.calendarNotes || {}).map(([noteDate, note]) => ({ note_date: noteDate, note })),
  };
}

async function replaceRemoteData(data) {
  if (!supabase) return;
  const rows = toDatabaseRows(data);
  const operations = [
    supabase.from("products").delete().neq("id", -1),
    supabase.from("staff").delete().neq("id", -1),
    supabase.from("sales").delete().neq("id", -1),
    supabase.from("purchase_orders").delete().neq("id", -1),
    supabase.from("calendar_notes").delete().neq("note_date", "1900-01-01"),
  ];
  const deleted = await Promise.all(operations);
  const deleteError = deleted.find((result) => result.error)?.error;
  if (deleteError) throw deleteError;
  const inserts = await Promise.all([
    supabase.from("products").insert(rows.products),
    supabase.from("staff").insert(rows.staff),
    supabase.from("sales").insert(rows.sales),
    supabase.from("purchase_orders").insert(rows.purchaseOrders),
    supabase.from("calendar_notes").insert(rows.calendarNotes),
  ]);
  const insertError = inserts.find((result) => result.error)?.error;
  if (insertError) throw insertError;
}

async function loadRemoteData() {
  if (!supabase) return null;
  const [products, staff, sales, purchaseOrders, calendarNotes] = await Promise.all([
    supabase.from("products").select("*").order("id"),
    supabase.from("staff").select("*").order("id"),
    supabase.from("sales").select("*").order("id"),
    supabase.from("purchase_orders").select("*").order("id"),
    supabase.from("calendar_notes").select("*").order("note_date"),
  ]);
  const result = [products, staff, sales, purchaseOrders, calendarNotes];
  const error = result.find((item) => item.error)?.error;
  if (error) throw error;
  if (!products.data?.length || !staff.data?.length) return null;
  return normalize({
    products: products.data.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      cost: Number(product.cost),
      stock: product.stock,
      visibleInMenu: product.visible_in_menu,
      inventoryManaged: product.inventory_managed,
    })),
    staff: staff.data.map((member) => ({ id: member.id, username: member.username, password: member.password, role: member.role })),
    sales: sales.data.map((sale) => ({
      id: sale.id,
      orderId: sale.order_id || "",
      customer: sale.customer || "",
      paymentMethod: sale.payment_method,
      date: sale.sale_date,
      time: sale.sale_time,
      staff: sale.staff,
      product: sale.product,
      qty: sale.qty,
      total: Number(sale.total),
      cost: Number(sale.cost),
    })),
    purchaseOrders: purchaseOrders.data.map((order) => ({
      id: order.id,
      productId: order.product_id,
      product: order.product,
      quantity: order.quantity,
      unitCost: Number(order.unit_cost),
      totalCost: Number(order.total_cost),
      staff: order.staff,
      date: order.order_date,
      status: order.status,
    })),
    calendarNotes: Object.fromEntries(calendarNotes.data.map((item) => [item.note_date, item.note])),
  });
}

function useStoreState() {
  const [data, setData] = useState(load);
  const [remoteReady, setRemoteReady] = useState(!supabase);
  const [session, setSession] = useState(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [activePage, setActivePage] = useState(() => localStorage.getItem(ACTIVE_PAGE_KEY) || "dashboard");

  useEffect(() => {
    if (!remoteReady) return;
    save(data);
    if (supabase) {
      replaceRemoteData(data).catch((error) => console.warn("Failed to sync Supabase data", error));
    }
  }, [data, remoteReady]);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    loadRemoteData()
      .then((remoteData) => {
        if (!active) return;
        if (remoteData) setData(remoteData);
      })
      .catch((error) => console.warn("Failed to load Supabase data, using local data", error))
      .finally(() => {
        if (active) setRemoteReady(true);
      });
    return () => { active = false; };
  }, []);

  function commit(updater) {
    setData((prev) => {
      const next = updater(prev);
      if (remoteReady) save(next);
      return next;
    });
  }

  function setSessionAndPersist(s) {
    setSession(s);
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch {}
  }

  function setActivePageAndPersist(page) {
    setActivePage(page);
    try {
      localStorage.setItem(ACTIVE_PAGE_KEY, page);
    } catch {}
  }

  return {
    data,
    commit,
    session,
    setSession: setSessionAndPersist,
    activePage,
    setActivePage: setActivePageAndPersist,
    today,
    money,
  };
}

export function StoreProvider({ children }) {
  const store = useStoreState();
  return createElement(StoreContext.Provider, { value: store }, children);
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}

export { today, money, menuCategories, purchaseOrderStatusOptions };

// Calendar helpers (used by Calendar page)
export function summarizeSales(rows) {
  let revenue = rows.reduce((a, s) => a + s.total, 0);
  let cost = rows.reduce((a, s) => a + s.cost, 0);
  let orders = rows.length;
  let items = rows.reduce((a, s) => a + s.qty, 0);
  return { revenue, cost, profit: revenue - cost, orders, items };
}

export function formatPeriodLabel(period, dateValue) {
  const d = new Date(dateValue + "T00:00:00");
  if (period === "day") return d.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  if (period === "week") {
    let start = getWeekStart(d);
    let end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("en-PH", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`;
  }
  if (period === "month") return d.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
  return d.toLocaleDateString("en-PH", { year: "numeric" });
}

export function getWeekStart(date) {
  let start = new Date(date);
  let day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  return start;
}

export function getCalendarPeriodDates(period, dateValue) {
  const d = new Date(dateValue + "T00:00:00");
  let dates = [];
  if (period === "day") { dates = [dateValue]; return dates; }
  if (period === "week") {
    let start = getWeekStart(d);
    for (let i = 0; i < 7; i++) {
      let day = new Date(start);
      day.setDate(start.getDate() + i);
      dates.push(day.toISOString().slice(0, 10));
    }
    return dates;
  }
  if (period === "month") {
    let year = d.getFullYear();
    let month = d.getMonth();
    let lastDay = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      let dt = new Date(year, month, i);
      dates.push(dt.toISOString().slice(0, 10));
    }
    return dates;
  }
  let year = d.getFullYear();
  for (let m = 0; m < 12; m++) {
    let dt = new Date(year, m, 1);
    dates.push(dt.toISOString().slice(0, 10));
  }
  return dates;
}

export function calendarMonthGrid(dateValue, data, selectedCalendarDate) {
  const d = new Date(dateValue + "T00:00:00");
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastOfMonth.getDate();
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let cells = [];
  for (let i = 0; i < 42; i++) {
    let dayNum = i - startOffset + 1;
    let current = new Date(year, month, dayNum);
    let cellDate = current.toISOString().slice(0, 10);
    let isCurrentMonth = current.getMonth() === month;
    let isSelected = cellDate === selectedCalendarDate;
    let sales = data.sales.filter((s) => s.date === cellDate);
    let total = summarizeSales(sales);
    let note = (data.calendarNotes || {})[cellDate] || "";
    let dayNumber = current.getDate();
    let classes = [];
    if (!isCurrentMonth) classes.push("muted");
    if (isSelected) classes.push("selected");
    cells.push(`<button type="button" class="calendar-day ${classes.join(" ")}" onclick="window.__setCalendarDate('${cellDate}')" style="display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-start;min-height:120px;padding:8px;border:1px solid var(--line);background:${isSelected ? "#1d1d1d" : "#121212"};border-radius:10px;color:#fff;text-align:left;cursor:pointer;">
      <div style="display:flex;justify-content:space-between;width:100%;align-items:center;"><span style="font-weight:700;">${dayNumber}</span>${sales.length ? `<span class="badge">${sales.length}</span>` : ""}</div>
      ${sales.length ? `<span style="margin-top:8px;font-size:11px;color:#c8f7d8;">${money(total.revenue)}</span>` : ""}
      ${note ? `<span style="margin-top:4px;font-size:10px;color:#ddd;line-height:1.3;display:block;max-height:32px;overflow:hidden;">${note.slice(0, 30)}${note.length > 30 ? "..." : ""}</span>` : ""}
    </button>`);
  }
  return `<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;">
    ${labels.map((label) => `<div style="text-align:center;color:#aaa;font-size:11px;padding-bottom:8px;text-transform:uppercase;letter-spacing:0.08em;">${label}</div>`).join("")}
    ${cells.join("")}
  </div>`;
}

export function calendarDateList(period, dateValue, data, selectedCalendarDate) {
  const dates = getCalendarPeriodDates(period, dateValue);
  let items = dates.map((d) => {
    let daySales = data.sales.filter((s) => s.date === d);
    let totals = summarizeSales(daySales);
    let active = d === selectedCalendarDate ? 'style="border-color:#fff;background:#1a1a1a;"' : "";
    return `<button class="card" ${active} onclick="window.__setCalendarDate('${d}')" style="display:block;width:100%;text-align:left;border:1px solid var(--line);margin-bottom:10px;background:rgba(255,255,255,0.01);color:#fff;padding:12px;border-radius:10px;">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;"><b>${new Date(d + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</b><span class="badge">${daySales.length} orders</span></div>
      <div class="metric-label" style="margin-top:8px;">Revenue: ${money(totals.revenue)} • Profit: ${money(totals.profit)}</div>
      <div class="muted" style="margin-top:4px;">${(data.calendarNotes || {})[d] ? `Note: ${(data.calendarNotes || {})[d].slice(0, 60)}${((data.calendarNotes || {})[d].length > 60 ? "..." : "")}` : "No note yet."}</div>
    </button>`;
  }).join("");
  return items || `<p class="muted">No sales recorded in this period.</p>`;
}