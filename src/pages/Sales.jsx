import { useState, useEffect } from "react";
import { useStore, today, money } from "../store/useStore";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function Sales({ data, session }) {
  const { commit } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentOrder, setCurrentOrder] = useState([]);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    setChartKey((k) => k + 1);
  }, [data.sales, session.username]);

  const visibleProducts = data.products.filter((p) => p.visibleInMenu !== false);
  const groups = ["Hot Coffee", "Iced Coffee", "Frappe", "Solo", "Rice Meal", "Extras"].map((category) => ({
    category,
    items: visibleProducts.filter((p) => p.category === category && (!searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()))),
  })).filter((g) => g.items.length > 0);

  const subtotal = currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0);

  function adjustOrderQty(productId, change) {
    setCurrentOrder((order) => order.map((item) => {
      if (item.productId !== productId) return item;
      const product = data.products.find((p) => p.id === productId);
      const next = Math.min(product?.stock || 1, Math.max(1, item.qty + change));
      return { ...item, qty: next };
    }));
  }

  function addToOrder(productId) {
    const product = data.products.find((p) => p.id === productId);
    if (!product) return;
    const existing = currentOrder.find((item) => Number(item.productId) === Number(productId));
    if (existing) {
      if (existing.qty + 1 > product.stock) return alert(`You can only add ${product.stock - existing.qty} more unit(s) of ${product.name}.`);
      setCurrentOrder((order) => order.map((item) => item.productId === productId ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCurrentOrder((order) => [...order, { productId: product.id, name: product.name, price: product.price, qty: 1, stock: product.stock }]);
    }
  }

  function removeFromOrder(productId) {
    setCurrentOrder((order) => order.filter((item) => Number(item.productId) !== Number(productId)));
  }

  function completeOrder() {
    if (!currentOrder.length) return alert("Add at least one item before completing the order.");
    const paymentMethod = document.getElementById("posPaymentMethod")?.value || "Cash";
    const customer = document.getElementById("posCustomer")?.value?.trim() || "";
    const orderId = `ORD-${Date.now()}`;
    const orderTotal = currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0);
    commit((d) => {
      const next = structuredClone(d);
      const now = new Date();
      currentOrder.forEach((item, index) => {
        const product = next.products.find((p) => p.id === Number(item.productId));
        if (!product || item.qty > product.stock) return;
        product.stock -= item.qty;
        next.sales.push({
          id: Date.now() + index,
          orderId,
          customer,
          paymentMethod,
          date: today(),
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          staff: session.username,
          product: product.name,
          qty: item.qty,
          total: product.price * item.qty,
          cost: (product.cost || 0) * item.qty,
        });
      });
      return next;
    });
    setCurrentOrder([]);
    setSearchTerm("");
    alert(`Order ${orderId} completed successfully. Total: ${money(orderTotal)}`);
  }

  return (
    <>
      <div className="panel">
        <div className="panel-head"><b>POS / Order Entry</b></div>
        <div className="pos-layout">
          <div>
            <div className="pos-search">
              <input id="posSearch" placeholder="Search by product or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            {groups.length === 0 && <div className="pos-empty">No products match your search.</div>}
            {groups.map(({ category, items }) => (
              <section className="pos-category-group" key={category}>
                <h3 className="pos-category-header">{category}</h3>
                <div className="pos-category-items">
                  {items.map((product) => {
                    const stockStatus = product.stock <= 0 ? "out" : product.stock <= 5 ? "low" : "available";
                    return (
                      <div className="product-card" key={product.id}>
                        <div className="product-header">
                          <h3 className="product-name">{product.name}</h3>
                          <div className="product-price">{money(product.price)}</div>
                        </div>
                        <span className={`stock-pill ${stockStatus}`}>{product.stock} {product.stock === 1 ? "unit" : "units"}</span>
                        <div className="qty-control">
                          <button type="button" onClick={() => adjustOrderQty(product.id, -1)}>−</button>
                          <input type="number" min="1" max={product.stock} value={currentOrder.find((i) => i.productId === product.id)?.qty || 1} onChange={(e) => adjustOrderQty(product.id, Number(e.target.value) - (currentOrder.find((i) => i.productId === product.id)?.qty || 1))} />
                          <button type="button" onClick={() => adjustOrderQty(product.id, 1)}>+</button>
                        </div>
                        <button type="button" className="add-order-btn" disabled={product.stock <= 0} onClick={() => addToOrder(product.id)}>Add</button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          <aside className="order-summary">
            <div className="panel-head" style={{ margin: 0 }}><b>Current Order</b><button className="btn dark" type="button" onClick={() => setCurrentOrder([])}>Clear</button></div>
            <div>
              <label>Customer</label>
              <input id="posCustomer" placeholder="Optional customer name" />
            </div>
            <div>
              <label>Payment Method</label>
              <select id="posPaymentMethod"><option value="Cash">Cash</option><option value="GCash">GCash</option><option value="Card">Card</option></select>
            </div>
            <div id="posOrderSummary" className="summary-list">
              {currentOrder.length === 0 ? <div className="summary-empty">No items added yet. Select products from the menu to start the order.</div> : currentOrder.map((item) => (
                <div className="summary-item" key={item.productId}>
                  <div><strong>{item.name}</strong><div className="summary-qty">Qty: {item.qty}</div></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="summary-total">{money(item.price * item.qty)}</span><button type="button" className="btn danger" onClick={() => removeFromOrder(item.productId)}>Remove</button></div>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="totals-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="totals-row total"><span>Total</span><span>{money(subtotal)}</span></div>
            </div>
            <div className="pos-order-actions">
              <button className="btn dark" type="button" onClick={() => setCurrentOrder([])}>Cancel</button>
              <button className="btn" type="button" onClick={completeOrder}>Complete Order</button>
            </div>
          </aside>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><b>Purchase Monitoring</b></div>
        <SalesTable rows={data.sales.slice().reverse()} data={data} session={session} commit={commit} />
      </div>
    </>
  );
}

function SalesTable({ rows, data, session, commit }) {
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