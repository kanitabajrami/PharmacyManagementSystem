import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * IMPORTANT:
 * - VITE_API_BASE must exist at BUILD time
 * - Fallback prevents `undefined/api/...`
 */
const API_BASE =
  import.meta.env.VITE_API_BASE || "https://pharmacymanagementsystem-fvbjgah5b9axg3hz.francecentral-01.azurewebsites.net";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userNameOrEmail: username,
          password,
        }),
      });

      if (!res.ok) {
        alert("Invalid username or password");
        return;
      }

      const { token } = await res.json();
      if (!token) {
        alert("No token returned from server");
        return;
      }

      // Decode roles safely
      const payload = JSON.parse(atob(token.split(".")[1]));
      const roleClaim =
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      const roles = Array.isArray(roleClaim)
        ? roleClaim
        : roleClaim
        ? [roleClaim]
        : [];

      localStorage.setItem("token", token);
      localStorage.setItem("roles", JSON.stringify(roles));

      if (roles.includes("Admin")) navigate("/admin");
      else if (roles.includes("User")) navigate("/user");
      else navigate("/");
    } catch (err) {
      console.error(err);
      alert("Backend server failed or CORS issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username or Email"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />

      <button disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
