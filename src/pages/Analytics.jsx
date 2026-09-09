import { useEffect, useRef } from "react";
import { useStore, money } from "../store/useStore";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function Analytics({ data, session, chartKey }) {
  const salesChartRef = useRef(null);
  const flowChartRef = useRef(null);

  useEffect(() => {
    const sales = session.role === "admin" ? data.sales : data.sales.filter((s) => s.staff === session.username);
    const days = [...Array(7)].map((_, i) => {
      let d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    const vals = days.map((d) => sales.filter((s) => s.date === d).reduce((a, s) => a + s.total, 0));
    const profits = days.map((d) => sales.filter((s) => s.date === d).reduce((a, s) => a + s.total - s.cost, 0));

    if (salesChartRef.current) {
      const ctx = salesChartRef.current.getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: { labels: days.map((d) => d.slice(5)), datasets: [{ label: "Revenue", data: vals, borderColor: "#fff" }, { label: "Profit", data: profits, borderColor: "#7ee787" }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#bbb" } } }, scales: { x: { ticks: { color: "#888" }, grid: { color: "#222" } }, y: { ticks: { color: "#888" }, grid: { color: "#222" } } } },
      });
    }

    const hours = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17"];
    const hv = hours.map((h) => sales.filter((s) => s.time.startsWith(h)).reduce((a, s) => a + 1, 0));
    if (flowChartRef.current) {
      const ctx = flowChartRef.current.getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: { labels: hours.map((h) => h + ":00"), datasets: [{ label: "Orders", data: hv, backgroundColor: "#fff" }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#bbb" } } }, scales: { x: { ticks: { color: "#888" }, grid: { color: "#222" } }, y: { ticks: { color: "#888" }, grid: { color: "#222" }, beginAtZero: true } } },
      });
    }

    return () => {
      Chart.getChart(salesChartRef.current)?.destroy();
      Chart.getChart(flowChartRef.current)?.destroy();
    };
  }, [data.sales, session.username, chartKey]);

  const sales = session.role === "admin" ? data.sales : data.sales.filter((s) => s.staff === session.username);
  const t = { revenue: sales.reduce((a, s) => a + s.total, 0), cost: sales.reduce((a, s) => a + s.cost, 0), orders: sales.length, items: sales.reduce((a, s) => a + s.qty, 0) };
  t.profit = t.revenue - t.cost;
  const avgOrder = t.revenue / (t.orders || 1);
  const lowStock = data.products.filter((p) => p.stock <= 5).length;

  return (
    <>
      <div className="cards">
        <div className="card"><div className="metric-label">AVG. ORDER VALUE</div><div className="metric">{money(t.revenue / (t.orders || 1))}</div></div>
        <div className="card"><div className="metric-label">PROFIT MARGIN</div><div className="metric">{((t.profit / (t.revenue || 1)) * 100).toFixed(1)}%</div></div>
        <div className="card"><div className="metric-label">UNITS SOLD</div><div className="metric">{t.items}</div></div>
        <div className="card"><div className="metric-label">LOW STOCK ITEMS</div><div className="metric">{lowStock}</div></div>
      </div>
      <div className="grid2">
        <div className="panel chart-card">
          <div className="panel-head"><b>Revenue vs Profit</b></div>
          <div className="chart-wrap"><canvas ref={salesChartRef} id="salesChart"></canvas></div>
        </div>
        <div className="panel chart-card">
          <div className="panel-head"><b>Customer Flow by Hour</b></div>
          <div className="chart-wrap"><canvas ref={flowChartRef} id="flowChart"></canvas></div>
        </div>
      </div>
    </>
  );
}