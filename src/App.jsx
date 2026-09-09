import { useState, useEffect, useCallback } from "react";
import { useStore } from "./store/useStore";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Menu from "./pages/Menu";
import Staff from "./pages/Staff";
import Calendar from "./pages/Calendar";
import Analytics from "./pages/Analytics";
import PurchaseOrders from "./pages/PurchaseOrders";
import Records from "./pages/Records";

const pages = {
  dashboard: Dashboard,
  sales: Sales,
  analytics: Analytics,
  records: Records,
  menu: Menu,
  inventory: Inventory,
  staff: Staff,
  calendar: Calendar,
  purchaseOrders: PurchaseOrders,
};

export default function App() {
  const { data, session, activePage, setActivePage, commit } = useStore();
  const [chartKey, setChartKey] = useState(0);

  // Re-render charts when activePage changes
  useEffect(() => {
    setChartKey((k) => k + 1);
  }, [activePage]);

  if (!session) return <Login />;

  const Component = pages[activePage] || Dashboard;

  const navItems =
    session.role === "admin"
      ? [
          ["dashboard", "Dashboard"],
          ["sales", "POS/Orders"],
          ["analytics", "Sales"],
          ["records", "Liquidation"],
          ["menu", "Menu"],
          ["inventory", "Inventory"],
          ["staff", "Staff"],
          ["calendar", "Calendar"],
          ["purchaseOrders", "Purchase Orders"],
        ]
      : [
          ["dashboard", "Dashboard"],
          ["sales", "POS/Orders"],
          ["analytics", "Sales"],
          ["menu", "Menu"],
        ];

  return (
    <AppLayout
      session={session}
      navItems={navItems}
      activePage={activePage}
      onNavigate={setActivePage}
    >
      <Component
        key={activePage}
        data={data}
        commit={commit}
        session={session}
        chartKey={chartKey}
      />
    </AppLayout>
  );
}
