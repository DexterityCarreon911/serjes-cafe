import { useState } from "react";
import { useStore, money } from "../store/useStore";

export default function Inventory({ data, session }) {
  const { commit } = useStore();
  const [search, setSearch] = useState("");

  function openInventoryModal(id) {
    if (session.role !== "admin") return alert("Staff cannot edit menu items.");
    const p = data.products.find((x) => x.id === id) || { name: "", category: "Hot Coffee", price: "", cost: "", stock: "" };
    const modal = document.getElementById("modal");
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-head"><h2>${id ? "Edit Inventory" : "Add Inventory"}</h2><button class="icon-btn" aria-label="Close">×</button></div>
        <form class="formgrid">
          <div class="full"><label>Product name</label><input id="productName" value="${p.name}" required></div>
          <div><label>Category</label><select id="productCategory">${["Hot Coffee", "Iced Coffee", "Frappe", "Solo", "Rice Meal", "Extras"].map(c => `<option value="${c}" ${p.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div><label>Selling price</label><input id="productPrice" type="number" min="0" value="${p.price}" required></div>
          <div><label>Unit cost</label><input id="productCost" type="number" min="0" value="${p.cost}" required></div>
          <div><label>Stock</label><input id="productStock" type="number" min="0" value="${p.stock}" required></div>
          <div class="full modal-actions"><button type="button" class="btn dark">Cancel</button><button class="btn">Save Inventory</button></div>
        </form>
      </div>`;
    const card = modal.querySelector(".modal-card");
    card.querySelector("form").addEventListener("submit", (event) => saveProduct(event, id));
    card.querySelector(".icon-btn").addEventListener("click", closeModal);
    card.querySelector(".modal-actions .dark").addEventListener("click", closeModal);
    modal.classList.remove("hidden");
  }

  function saveProduct(e, id) {
    e.preventDefault();
    if (session.role !== "admin") return alert("Staff cannot edit menu items.");
    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value;
    const price = Number(document.getElementById("productPrice").value || 0);
    const cost = Number(document.getElementById("productCost").value || 0);
    const stock = Number(document.getElementById("productStock").value || 0);
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

  function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.classList.add("hidden");
  }

  function deleteProduct(id) {
    if (session.role !== "admin") return alert("Staff cannot edit menu items.");
    if (!window.confirm("Delete this inventory item permanently?")) return;
    commit((d) => {
      const next = structuredClone(d);
      next.products = next.products.filter((p) => p.id !== id);
      return next;
    });
  }

  function deleteAllProducts() {
    if (session.role !== "admin") return alert("Staff cannot edit menu items.");
    if (!window.confirm("Delete all inventory items permanently?")) return;
    commit((d) => {
      const next = structuredClone(d);
      next.products = next.products.filter((p) => p.inventoryManaged === false);
      return next;
    });
  }

  function undoAllRemovedItems() {
    if (session.role !== "admin") return alert("Staff cannot edit menu items.");
    let restored = 0;
    commit((d) => {
      const next = structuredClone(d);
      next.products.forEach((p) => { if (p.visibleInMenu === false) { p.visibleInMenu = true; restored++; } });
      return next;
    });
    if (restored === 0) alert("No removed menu items to undo.");
  }

  const filtered = data.products.filter((p) => p.inventoryManaged !== false && (!search || [p.name, p.category].join(" ").toLowerCase().includes(search.toLowerCase())));
  const low = filtered.filter((p) => p.stock > 0 && p.stock <= 5);
  const out = filtered.filter((p) => p.stock <= 0);

  return (
    <div className="panel">
      <div className="panel-head">
        <b>Inventory</b>
        <div className="actions">
          <button className="btn" onClick={() => openInventoryModal()}>Add Inventory</button>
          <button className="btn danger" onClick={deleteAllProducts}>Delete All Items</button>
          <button className="btn dark" onClick={undoAllRemovedItems}>Undo All Removed Items</button>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <input id="inventorySearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory..." />
      </div>
      {(low.length || out.length) ? (
        <div className="danger" style={{ padding: "12px 0" }}>Inventory warning: {out.length ? `${out.length} item${out.length === 1 ? "" : "s"} out of stock` : ""}{out.length && low.length ? "; " : ""}{low.length ? `${low.length} item${low.length === 1 ? "" : "s"} low in stock` : ""}. Restock before accepting orders.</div>
      ) : (
        <div className="good" style={{ padding: "12px 0" }}>Inventory levels are healthy.</div>
      )}
      {["Hot Coffee", "Iced Coffee", "Frappe", "Solo", "Rice Meal", "Extras"].map((category) => {
        const items = filtered.filter((p) => p.category === category);
        return (
          <section className="menu-category" key={category}>
            <h3>{category}</h3>
            {items.length ? (
              <table>
                <thead><tr><th>Product</th><th>Price</th><th>Unit Cost</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{money(p.price)}</td>
                      <td>{money(p.cost)}</td>
                      <td>{p.stock}</td>
                      <td className={p.stock <= 0 || p.stock <= 5 ? "danger" : "good"}>{p.stock <= 0 ? "Out of Stock" : p.stock <= 5 ? "Low Stock" : "In Stock"}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn dark" onClick={() => openInventoryModal(p.id)}>Edit</button>
                          <button className="btn danger" onClick={() => deleteProduct(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="muted">No items in this category.</p>}
          </section>
        );
      })}
      {!filtered.length && <p className="muted">No matching inventory items.</p>}
    </div>
  );
}