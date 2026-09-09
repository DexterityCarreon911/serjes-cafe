import { useState } from "react";
import { useStore, today, money } from "../store/useStore";

export default function Modal() {
  const { data, session, commit } = useStore();
  const [modal, setModal] = useState(null);

  function openModal(title, id = null) {
    setModal({ title, id });
  }

  function closeModal() {
    setModal(null);
  }

  function saveProduct(id) {
    const name = document.getElementById("productName")?.value.trim();
    const category = document.getElementById("productCategory")?.value;
    const price = Number(document.getElementById("productPrice")?.value || 0);
    const cost = Number(document.getElementById("productCost")?.value || 0);
    const stock = Number(document.getElementById("productStock")?.value || 0);
    if (!name) return;
    commit((d) => {
      const next = structuredClone(d);
      const p = id ? next.products.find((x) => x.id === id) : null;
      if (p) {
        Object.assign(p, { name, category, price, cost, stock, inventoryManaged: true, visibleInMenu: p.visibleInMenu !== false });
      } else {
        next.products.push({ id: Date.now(), name, category, price, cost, stock, inventoryManaged: true, visibleInMenu: true });
      }
      return next;
    });
    closeModal();
  }

  function saveMenuItem(id) {
    const name = document.getElementById("menuName")?.value.trim();
    const category = document.getElementById("menuCategory")?.value;
    const price = Number(document.getElementById("menuPrice")?.value || 0);
    if (!name) return;
    commit((d) => {
      const next = structuredClone(d);
      const p = id ? next.products.find((x) => x.id === id) : null;
      if (p) {
        Object.assign(p, { name, category, price, inventoryManaged: false, stock: 0, cost: 0, visibleInMenu: true });
      } else {
        next.products.push({ id: Date.now(), name, category, price, inventoryManaged: false, stock: 0, cost: 0, visibleInMenu: true });
      }
      return next;
    });
    closeModal();
  }

  function addStaff() {
    const name = document.getElementById("staffName")?.value.trim();
    const password = document.getElementById("staffPassword")?.value;
    const role = document.getElementById("staffRole")?.value;
    if (!name) return;
    commit((d) => {
      const next = structuredClone(d);
      next.staff.push({ id: Date.now(), username: name, password, role });
      return next;
    });
    closeModal();
  }

  function addOrder() {
    const productSelect = document.getElementById("saleProduct");
    const qtyInput = document.getElementById("saleQty");
    const orderId = document.getElementById("orderId")?.value.trim() || "";
    const productId = Number(productSelect?.value || 0);
    const product = data.products.find((x) => x.id === productId);
    const qty = Number(qtyInput?.value || 1);
    if (!product || qty > product.stock) return;
    commit((d) => {
      const next = structuredClone(d);
      next.sales.push({
        id: Date.now(),
        orderId,
        paymentMethod: document.getElementById("paymentMethod")?.value || "Cash",
        date: today(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        staff: session.username,
        product: product.name,
        qty,
        total: product.price * qty,
        cost: product.cost * qty,
      });
      const p = next.products.find((x) => x.id === productId);
      if (p) p.stock = Math.max(0, p.stock - qty);
      return next;
    });
    closeModal();
  }

  function addPurchaseOrder() {
    const productId = Number(document.getElementById("poProduct")?.value || 0);
    const qty = Number(document.getElementById("poQty")?.value || 1);
    const status = document.getElementById("poStatus")?.value || "Pending";
    const product = data.products.find((x) => x.id === productId);
    if (!product) return;
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

  if (!modal) return null;

  const isInventory = modal.title.includes("Inventory");
  const isMenu = modal.title.includes("Menu Item");
  const isStaff = modal.title === "Add Staff";
  const isOrder = modal.title === "Add Order";
  const isPurchaseOrder = modal.title === "Create Purchase Order";

  const p = data.products.find((x) => x.id === modal.id) || { name: "", category: "Hot Coffee", price: "", cost: "", stock: "" };

  let body;
  if (isInventory) {
    body = (
      <form onSubmit={(e) => { e.preventDefault(); saveProduct(modal.id); }}>
        <div className="formgrid">
          <div className="full"><label>Product name</label><input id="productName" defaultValue={p.name} required /></div>
          <div><label>Category</label><select id="productCategory">{["Hot Coffee", "Iced Coffee", "Frappe", "Solo", "Rice Meal", "Extras"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label>Selling price</label><input id="productPrice" type="number" min="0" defaultValue={p.price} required /></div>
          <div><label>Unit cost</label><input id="productCost" type="number" min="0" defaultValue={p.cost} required /></div>
          <div><label>Stock</label><input id="productStock" type="number" min="0" defaultValue={p.stock} required /></div>
          <div className="full modal-actions"><button type="button" className="btn dark" onClick={closeModal}>Cancel</button><button className="btn">Save Inventory</button></div>
        </div>
      </form>
    );
  } else if (isMenu) {
    body = (
      <form onSubmit={(e) => { e.preventDefault(); saveMenuItem(modal.id); }}>
        <div className="formgrid">
          <div className="full"><label>Product name</label><input id="menuName" defaultValue={p.name} required /></div>
          <div><label>Category</label><select id="menuCategory">{["Hot Coffee", "Iced Coffee", "Frappe", "Solo", "Rice Meal", "Extras"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label>Selling price</label><input id="menuPrice" type="number" min="0" defaultValue={p.price} required /></div>
          <div className="full modal-actions"><button type="button" className="btn dark" onClick={closeModal}>Cancel</button><button className="btn">Save Menu Item</button></div>
        </div>
      </form>
    );
  } else if (isStaff) {
    body = (
      <form onSubmit={(e) => { e.preventDefault(); addStaff(); }}>
        <div className="formgrid">
          <div><label>Username</label><input id="staffName" required /></div>
          <div><label>Password</label><input id="staffPassword" type="password" required /></div>
          <div><label>Role</label><select id="staffRole"><option value="staff">Staff</option><option value="admin">Admin</option></select></div>
          <div className="full modal-actions"><button type="button" className="btn dark" onClick={closeModal}>Cancel</button><button className="btn">Add Staff</button></div>
        </div>
      </form>
    );
  } else if (isOrder) {
    body = (
      <form onSubmit={(e) => { e.preventDefault(); addOrder(); }}>
        <div className="formgrid">
          <div><label>Product</label><select id="saleProduct" defaultValue=""><option value="" disabled>Select product</option>{data.products.map((x) => <option key={x.id} value={x.id}>{x.name} — {money(x.price)}</option>)}</select></div>
          <div><label>Quantity</label><input id="saleQty" type="number" min="1" value="1" required /></div>
          <div><label>Staff on Duty</label><input value={session.username} readOnly /></div>
          <div><label>Payment Method</label><select id="paymentMethod"><option>Cash</option><option>GCash</option></select></div>
          <div><label>Customer / Order ID</label><input id="orderId" placeholder="Optional" /></div>
          <div className="full modal-actions"><button type="button" className="btn dark" onClick={closeModal}>Cancel</button><button className="btn">Save Order</button></div>
        </div>
      </form>
    );
  } else if (isPurchaseOrder) {
    const products = data.products.filter((x) => x.visibleInMenu !== false && x.name && x.category);
    const defaultProduct = products[0] || data.products[0];
    body = (
      <form onSubmit={(e) => { e.preventDefault(); addPurchaseOrder(); }}>
        <div className="formgrid">
          <div><label>Product</label><select id="poProduct" defaultValue={defaultProduct?.id || ""}>{products.map((x) => <option key={x.id} value={x.id}>{x.name} — {money(x.price)}</option>)}</select></div>
          <div><label>Quantity</label><input id="poQty" type="number" min="1" value="1" /></div>
          <div><label>Unit Cost</label><input id="poUnitCost" type="number" min="0" value={defaultProduct?.cost || 0} readOnly /></div>
          <div><label>Total Cost</label><input id="poTotalCost" type="number" min="0" value={defaultProduct?.cost || 0} readOnly /></div>
          <div><label>Managed By</label><input value={session.username} readOnly /></div>
          <div><label>Date</label><input value={today()} readOnly /></div>
          <div><label>Status</label><select id="poStatus">{["Draft", "Pending", "Approved", "Received", "Cancelled"].map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="full modal-actions"><button type="button" className="btn dark" onClick={closeModal}>Cancel</button><button className="btn">Save Purchase Order</button></div>
        </div>
      </form>
    );
  }

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="modal-card">
        <div className="modal-head"><h2>{modal.title}</h2><button className="icon-btn" onClick={closeModal} aria-label="Close">×</button></div>
        {body}
      </div>
    </div>
  );
}