import { useState, useEffect } from "react";
import { useStore, today, money } from "../store/useStore";

export default function Login() {
  const { data, commit, setSession } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("serjesSession");
    if (saved) {
      setSession(JSON.parse(saved));
      window.location.reload();
    }
  }, [setSession]);

  function handleLogin(e) {
    e.preventDefault();
    const account = data.staff.find((s) => s.username === username.trim() && s.password === password.trim());
    if (account) {
      const session = { username: account.username, role: account.role };
      setSession(session);
      localStorage.setItem("serjesActivePage", "dashboard");
      window.location.reload();
    } else {
      setError("Invalid login details.");
    }
  }

  function togglePassword() {
    setShowPassword((p) => !p);
  }

  function forgotPassword() {
    const u = window.prompt("Enter your username:");
    if (!u) return;
    const account = data.staff.find((s) => s.username === u.trim());
    if (!account) return alert("Username not found.");
    const next = window.prompt("Enter a new password (at least 6 characters):");
    if (!next || next.length < 6) return alert("Password must be at least 6 characters.");
    commit((d) => {
      const nextData = structuredClone(d);
      const a = nextData.staff.find((s) => s.id === account.id);
      if (a) a.password = next;
      return nextData;
    });
    alert("Password updated. You can now sign in.");
  }

  return (
    <section id="login">
      <div className="login-card">
        <div className="login-brand">
          <img src="/logo.jpg" alt="Serjes Cafe logo" />
          <div className="logo">SERJES CAFE</div>
          <div className="sub">Minimal cafe sales & operations dashboard</div>
        </div>
        <form id="loginForm" onSubmit={handleLogin}>
          {error && <div style={{ color: "var(--danger)", marginBottom: 12 }}>{error}</div>}
          <label>Username</label>
          <input id="username" required placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <label>Password</label>
          <div className="password-wrap">
            <input id="password" type={showPassword ? "text" : "password"} required placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="password-toggle" onClick={togglePassword}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button type="button" className="forgot-link" onClick={forgotPassword}>Forgot Password?</button>
          <button type="submit" className="primary">Sign in</button>
        </form>
      </div>
    </section>
  );
}