import { useStore, money } from "../store/useStore";

export default function Staff({ data, session }) {
  const { commit } = useStore();

  function openStaffModal() {
    const modal = document.getElementById("modal");
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-head"><h2>Add Staff</h2><button class="icon-btn" aria-label="Close">×</button></div>
        <form>
          <div class="formgrid">
            <div><label>Username</label><input id="staffName" required></div>
            <div><label>Password</label><input id="staffPassword" type="password" required></div>
            <div><label>Role</label><select id="staffRole"><option value="staff">Staff</option><option value="admin">Admin</option></select></div>
            <div class="full modal-actions"><button type="button" class="btn dark">Cancel</button><button class="btn">Add Staff</button></div>
          </div>
        </form>
      </div>`;
    const card = modal.querySelector(".modal-card");
    card.querySelector("form").addEventListener("submit", addStaff);
    card.querySelector(".icon-btn").addEventListener("click", closeModal);
    card.querySelector(".modal-actions .dark").addEventListener("click", closeModal);
    modal.classList.remove("hidden");
  }

  function addStaff(e) {
    e.preventDefault();
    const name = document.getElementById("staffName").value.trim();
    const password = document.getElementById("staffPassword").value;
    const role = document.getElementById("staffRole").value;
    if (!name) return;
    commit((d) => {
      const next = structuredClone(d);
      next.staff.push({ id: Date.now(), username: name, password, role });
      return next;
    });
    closeModal();
  }

  function deleteStaff(id) {
    if (!window.confirm("Delete this staff account?")) return;
    commit((d) => {
      const next = structuredClone(d);
      next.staff = next.staff.filter((s) => s.id !== id);
      return next;
    });
  }

  function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.classList.add("hidden");
  }

  return (
    <div className="panel">
      <div className="panel-head"><b>Staff Accounts</b><button className="btn" onClick={openStaffModal}>Add Staff</button></div>
      <table>
        <thead><tr><th>Username</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          {data.staff.map((s) => (
            <tr key={s.id}>
              <td>{s.username}</td>
              <td>{s.role}</td>
              <td>{s.username !== "admin" ? (
                <button className="btn danger" onClick={() => deleteStaff(s.id)}>Delete</button>
              ) : <span className="muted">Protected</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}