import { useEffect, useRef } from "react";
import { useStore, today, money } from "../store/useStore";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function Dashboard({ data, session, chartKey }) {
  const { commit } = useStore();
  const salesChartRef = useRef(null);
  const flowChartRef = useRef(null);

  function totals(sales = data.sales) {
    let revenue = sales.reduce((a, s) => a + s.total, 0);
    let cost = sales.reduce((a, s) => a + s.cost, 0);
    return { revenue, cost, profit: revenue - cost, orders: sales.length, items: sales.reduce((a, s) => a + s.qty, 0) };
  }

  function filteredSales() {
    return session.role === "admin" ? data.sales : data.sales.filter((s) => s.staff === session.username);
  }

  useEffect(() => {
    const sales = filteredSales();
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

  const s = totals(filteredSales());

  return (
    <div className="dashboard-page">
      <div className="cards dashboard-metrics">
        <div className="card"><div className="metric-label">REVENUE</div><div className="metric">{money(s.revenue)}</div></div>
        <div className="card"><div className="metric-label">PROFIT</div><div className="metric good">{money(s.profit)}</div></div>
        <div className="card"><div className="metric-label">ORDERS</div><div className="metric">{s.orders}</div></div>
        <div className="card"><div className="metric-label">ITEMS SOLD</div><div className="metric">{s.items}</div></div>
      </div>
      <div className="grid2 dashboard-charts">
        <div className="panel chart-card">
          <div className="panel-head"><b>Sales Progress</b><span className="muted">Last 7 days</span></div>
          <div className="chart-wrap"><canvas ref={salesChartRef} id="salesChart"></canvas></div>
        </div>
        <div className="panel chart-card">
          <div className="panel-head"><b>Customer Flow</b></div>
          <div className="chart-wrap"><canvas ref={flowChartRef} id="flowChart"></canvas></div>
        </div>
      </div>
      <div className="panel dashboard-recent">
        <div className="panel-head"><b>Recent Purchases</b><span className="muted">Monitoring</span></div>
        <SalesTable rows={filteredSales().slice(-8).reverse()} data={data} session={session} commit={commit} />
      </div>
    </div>
  );
}

function SalesTable({ rows, data, session, commit }) {
  if (!rows.length) return <p className="muted">No records yet.</p>;
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Date</th>
          <th>Time</th>
          <th>Staff</th>
          <th>Product</th>
          <th>Qty</th>
          <th>Payment</th>
          <th>Revenue</th>
          <th>Profit</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.id}>
            <td>#{s.id}</td>
            <td>{s.date}</td>
            <td>{s.time}</td>
            <td>{s.staff}</td>
            <td>{s.product}</td>
            <td>{s.qty}</td>
            <td>{s.paymentMethod || "Cash"}</td>
            <td>{money(s.total)}</td>
            <td className="good">{money(s.total - s.cost)}</td>
            <td>
              <button className="btn danger" onClick={() => deleteSale(s.id, data, commit, session)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function deleteSale(id, data, commit, session) {
  if (!window.confirm("Delete this sale record?")) return;
  commit((d) => {
    const next = structuredClone(d);
    const sale = next.sales.find((s) => s.id === id);
    if (!sale) return next;
    const product = next.products.find((p) => p.name === sale.product);
    if (product) product.stock += sale.qty;
    next.sales = next.sales.filter((s) => s.id !== id);
    return next;
  });
}