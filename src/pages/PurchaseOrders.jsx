import { useStore, today, money } from "../store/useStore";

export default function PurchaseOrders({ data, session }) {
  const { commit } = useStore();

  function openPurchaseOrderModal() {
    document.getElementById("poProduct")?.focus();
  }

  function updateSelectedPurchaseOrderSummary(selectEl) {
    if (!selectEl) return;
    const form = selectEl.closest("form");
    if (!form) return;
    const product = data.products.find((p) => Number(p.id) === Number(selectEl.value));
    const qtyInput = form.querySelector("#poQty");
    const unitCostInput = form.querySelector("#poUnitCost");
    const totalCostInput = form.querySelector("#poTotalCost");
    if (!product || !qtyInput || !unitCostInput || !totalCostInput) return;
    const qty = Number(qtyInput.value) || 1;
    const unitCost = Number(product.cost) || 0;
    unitCostInput.value = unitCost;
    totalCostInput.value = (unitCost * qty).toFixed(2);
  }

  function addPurchaseOrder(e) {
    e.preventDefault();
    const productId = Number(document.getElementById("poProduct")?.value || 0);
    const product = data.products.find((item) => item.id === productId);
    const qty = Number(document.getElementById("poQty")?.value || 1);
    const status = document.getElementById("poStatus")?.value || "Pending";
    if (!product) return alert("Please select a valid product.");
    if (!Number.isFinite(qty) || qty < 1) return alert("Please enter a valid quantity.");
    const unitCost = Number(product.cost) || 0;
    commit((d) => {
      const next = structuredClone(d);
      next.purchaseOrders.push({
        id: Date.now(), productId: product.id, product: product.name, quantity: qty, unitCost, totalCost: unitCost * qty, staff: session.username, date: today(), status
      });
      const p = next.products.find((x) => x.id === productId);
      if (p && (status === "Received" || status === "Approved")) p.stock += qty;
      return next;
    });
    closeModal();
  }

  function updatePurchaseOrderStatus(id, status) {
    const purchaseOrder = data.purchaseOrders.find((po) => po.id === id);
    if (!purchaseOrder) return;
    const product = data.products.find((item) => item.id === purchaseOrder.productId);
    if (product) {
      const wasReceived = purchaseOrder.status === "Received";
      const willBeReceived = status === "Received";
      if (!wasReceived && willBeReceived) product.stock += purchaseOrder.quantity;
      if (wasReceived && !willBeReceived) product.stock = Math.max(0, product.stock - purchaseOrder.quantity);
    }
    commit((d) => {
      const next = structuredClone(d);
      const po = next.purchaseOrders.find((x) => x.id === id);
      if (po) po.status = status;
      return next;
    });
  }

  function deletePurchaseOrder(id) {
    if (!window.confirm("Delete this purchase order?")) return;
    const purchaseOrder = data.purchaseOrders.find((po) => po.id === id);
    const product = data.products.find((item) => item.id === purchaseOrder.productId);
    if (product && purchaseOrder.status === "Received") product.stock = Math.max(0, product.stock - purchaseOrder.quantity);
    commit((d) => {
      const next = structuredClone(d);
      next.purchaseOrders = next.purchaseOrders.filter((po) => po.id !== id);
      return next;
    });
  }

  function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.classList.add("hidden");
  }

  function savePurchaseOrderForm(e) {
    e.preventDefault();
    addPurchaseOrder(e);
  }

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <b>Purchase Orders</b>
          <button className="btn" type="button" onClick={openPurchaseOrderModal}>Create Purchase Order</button>
        </div>
        <form onSubmit={savePurchaseOrderForm} className="formgrid">
          <div><label>Product</label><select id="poProduct" defaultValue="" onChange={(e) => updateSelectedPurchaseOrderSummary(e.target)} required><option value="" disabled>Select product</option>{data.products.map((p) => <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>)}</select></div>
          <div><label>Quantity</label><input id="poQty" type="number" min="1" defaultValue="1" onChange={() => updateSelectedPurchaseOrderSummary(document.getElementById("poProduct"))} /></div>
          <div><label>Unit Cost</label><input id="poUnitCost" type="number" min="0" readOnly /></div>
          <div><label>Total Cost</label><input id="poTotalCost" type="number" min="0" readOnly /></div>
          <div><label>Managed By</label><input value={session.username} readOnly /></div>
          <div><label>Date</label><input value={today()} readOnly /></div>
          <div><label>Status</label><select id="poStatus"><option>Draft</option><option>Pending</option><option>Approved</option><option>Received</option><option>Cancelled</option></select></div>
          <div className="full"><button className="btn">Save Purchase Order</button></div>
        </form>
      </div>
      <div className="panel">
        <div className="panel-head"><b>Recorded Purchase Orders</b></div>
        <table>
          <thead>
            <tr><th>ID</th><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total Cost</th><th>Staff</th><th>Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {data.purchaseOrders.slice().reverse().map((po) => (
              <tr key={po.id}>
                <td>#{po.id}</td><td>{po.product}</td><td>{po.quantity}</td><td>{money(po.unitCost)}</td><td>{money(po.totalCost)}</td><td>{po.staff}</td><td>{po.date}</td>
                <td>
                  <select defaultValue={po.status} onChange={(e) => updatePurchaseOrderStatus(po.id, e.target.value)} style={{ background: "#090909", color: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: 8 }}>
                    {["Draft", "Pending", "Approved", "Received", "Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td><button className="btn danger" onClick={() => deletePurchaseOrder(po.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}