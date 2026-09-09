import { useStore, money } from "../store/useStore";

export default function Records({ data, session }) {
  const sales = session.role === "admin" ? data.sales : data.sales.filter((s) => s.staff === session.username);
  const t = { revenue: sales.reduce((a, s) => a + s.total, 0), cost: sales.reduce((a, s) => a + s.cost, 0), orders: sales.length, items: sales.reduce((a, s) => a + s.qty, 0) };

  function exportCSV() {
    const rows = [["ID", "Date", "Time", "Staff", "Product", "Qty", "Revenue", "Cost", "Profit"], ...data.sales.map((s) => [s.id, s.date, s.time, s.staff, s.product, s.qty, s.total, s.cost, s.total - s.cost])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "serjes-cafe-sales.csv";
    a.click();
  }

  return (
    <>
      <div className="cards">
        <div className="card"><div className="metric-label">TOTAL REVENUE</div><div className="metric">{money(t.revenue)}</div></div>
        <div className="card"><div className="metric-label">TOTAL COST</div><div className="metric">{money(t.cost)}</div></div>
        <div className="card"><div className="metric-label">TOTAL PROFIT</div><div className="metric good">{money(t.profit)}</div></div>
        <div className="card"><div className="metric-label">TOTAL ORDERS</div><div className="metric">{sales.length}</div></div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <b>{session.role === "admin" ? "All Sales Records" : "My Sales Records"}</b>
          {session.role === "admin" && <button className="btn dark" onClick={exportCSV}>Export CSV</button>}
        </div>
        <SalesTable rows={sales.slice().reverse()} data={data} session={session} />
      </div>
    </>
  );
}

function SalesTable({ rows, data, session }) {
  const { commit } = useStore();
  if (!rows.length) return <p className="muted">No records yet.</p>;
  return (
    <table>
      <thead>
        <tr><th>ID</th><th>Date</th><th>Time</th><th>Staff</th><th>Product</th><th>Qty</th><th>Payment</th><th>Revenue</th><th>Profit</th><th>Actions</th></tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.id}>
            <td>#{s.id}</td><td>{s.date}</td><td>{s.time}</td><td>{s.staff}</td><td>{s.product}</td><td>{s.qty}</td><td>{s.paymentMethod || "Cash"}</td><td>{money(s.total)}</td><td className="good">{money(s.total - s.cost)}</td>
            <td><button className="btn danger" onClick={() => { if (window.confirm("Delete this sale record?")) { const product = data.products.find((p) => p.name === s.product); if (product) product.stock += s.qty; commit((d) => { const next = structuredClone(d); next.sales = next.sales.filter((x) => x.id !== s.id); return next; }); } }}>Delete</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}