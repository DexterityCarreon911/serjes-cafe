import { useState } from "react";
import { useStore, money } from "../store/useStore";

export default function Menu({ data, session }) {
  const { commit } = useStore();
  const [search, setSearch] = useState("");

  function openMenuModal(id) {
    if (session.role !== "admin") return alert("Staff cannot edit menu items.");
    const p = data.products.find((x) => x.id === id) || { name: "", category: "Hot Coffee", price: "" };
    const modal = document.getElementById("modal");
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-head"><h2>${id ? "Edit Menu Item" : "Add Menu Item"}</h2><button class="icon-btn" aria-label="Close">×</button></div>
        <form class="formgrid">
          <div class="full"><label>Product name</label><input id="menuName" value="${p.name}" required></div>
          <div><label>Category</label><select id="menuCategory">${["Hot Coffee", "Iced Coffee", "Frappe", "Solo", "Rice Meal", "Extras"].map(c => `<option value="${c}" ${p.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div><label>Selling price</label><input id="menuPrice" type="number" min="0" value="${p.price}" required></div>
          <div class="full modal-actions"><button type="button" class="btn dark">Cancel</button><button class="btn">Save Menu Item</button></div>
        </form>
      </div>`;
    const card = modal.querySelector(".modal-card");
    card.querySelector("form").addEventListener("submit", (event) => saveMenuItem(event, id));
    card.querySelector(".icon-btn").addEventListener("click", closeModal);
    card.querySelector(".modal-actions .dark").addEventListener("click", closeModal);
    modal.classList.remove("hidden");
  }

  function saveMenuItem(e, id) {
    e.preventDefault();
    if (session.role !== "admin") return alert("Staff cannot edit menu items.");
    const name = document.getElementById("menuName").value.trim();
    const category = document.getElementById("menuCategory").value;
    const price = Number(document.getElementById("menuPrice").value || 0);
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

  function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.classList.add("hidden");
  }

  function removeMenuItem(id) {
    if (session.role !== "admin") return alert("Staff cannot edit menu items.");
    if (!window.confirm("Delete this menu item permanently?")) return;
    commit((d) => {
      const next = structuredClone(d);
      next.products = next.products.filter((p) => p.id !== id);
      return next;
    });
  }

  function deleteAllMenuItems() {
    if (session.role !== "admin") return alert("Staff cannot edit menu items.");
    if (!window.confirm("Delete all menu items permanently?")) return;
    commit((d) => {
      const next = structuredClone(d);
      next.products = next.products.filter((p) => p.visibleInMenu === false);
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

  const visible = data.products.filter((p) => p.visibleInMenu !== false);
  const filtered = visible.filter((p) => !search || [p.name, p.category].join(" ").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="panel">
      <div className="panel-head">
        <b>Menu</b>
        <div className="actions">
          {session.role === "admin" && (
            <>
              <button className="btn" onClick={() => openMenuModal()}>Add Menu Item</button>
              <button className="btn danger" onClick={deleteAllMenuItems}>Delete All Items</button>
              <button className="btn dark" onClick={undoAllRemovedItems}>Undo All Removed Items</button>
            </>
          )}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <input id="menuSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu..." />
      </div>
      {["Hot Coffee", "Iced Coffee", "Frappe", "Solo", "Rice Meal", "Extras"].map((category) => {
        const items = filtered.filter((p) => p.category === category);
        return (
          <section className="menu-category" key={category}>
            <h3>{category}</h3>
            {items.length ? (
              <table>
                <thead><tr><th>Product</th><th>Price</th>{session.role === "admin" && <th>Actions</th>}</tr></thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{money(p.price)}</td>
                      {session.role === "admin" && (
                        <td>
                          <div className="table-actions">
                            <button className="btn dark" onClick={() => openMenuModal(p.id)}>Edit</button>
                            <button className="btn danger" onClick={() => removeMenuItem(p.id)}>Remove</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="muted">No items in this category.</p>}
          </section>
        );
      })}
    </div>
  );
}