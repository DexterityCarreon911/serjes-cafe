import { useState } from "react";

export default function AppLayout({ session, navItems, activePage, onNavigate, children }) {
  const [adminNavOpen, setAdminNavOpen] = useState(true);

  function logout() {
    localStorage.removeItem("serjesSession");
    window.location.reload();
  }

  const dateLabel = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          SERJES <span className="role">{session.role}</span>
        </div>
        <nav className="nav">
          {session.role === "admin" || session.role === "staff" ? (
            <>
              <button
                data-page="dashboard"
                className={activePage === "dashboard" ? "active" : ""}
                aria-expanded={String(adminNavOpen)}
                onClick={() => {
                  setAdminNavOpen((o) => !o);
                  onNavigate("dashboard");
                }}
              >
                Dashboard
              </button>
              <div className={adminNavOpen ? "" : "hidden"} id="adminNavMenu">
                {navItems
                  .filter((x) => x[0] !== "dashboard")
                  .map((x) => (
                    <button
                      key={x[0]}
                      data-page={x[0]}
                      className={activePage === x[0] ? "active" : ""}
                      onClick={() => onNavigate(x[0])}
                    >
                      {x[1]}
                    </button>
                  ))}
              </div>
            </>
          ) : (
            navItems.map((x) => (
              <button
                key={x[0]}
                data-page={x[0]}
                className={activePage === x[0] ? "active" : ""}
                onClick={() => onNavigate(x[0])}
              >
                {x[1]}
              </button>
            ))
          )}
        </nav>
        <button className="logout" onClick={logout}>
          Log out
        </button>
      </aside>

      <main>
        <div className="topbar">
          <div>
            <h1 id="pageTitle">{navItems.find((n) => n[0] === activePage)?.[1] || "Dashboard"}</h1>
            <div className="muted" id="dateLabel">
              {dateLabel}
            </div>
          </div>
          <div className="badge" id="userLabel">
            {session.username.toUpperCase()}
          </div>
        </div>
        {children}
      </main>

      <div id="modal" className="modal hidden" onClick={(event) => event.target === event.currentTarget && event.currentTarget.classList.add("hidden")}>
        <div id="modalCard" className="modal-card" />
      </div>
    </div>
  );
}