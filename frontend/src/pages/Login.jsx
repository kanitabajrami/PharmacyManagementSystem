import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "https://localhost:7201/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userNameOrEmail: username, password }),
        }
      );

      if (!response.ok) {
        alert("Invalid username or password");
        return;
      }

      const data = await response.json();
      const token = data.token;

      // Decode JWT token to get role
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      // Save token and role in localStorage for later use
      localStorage.setItem("token", token);
      localStorage.setItem("roles", JSON.stringify(roles));

      // Redirect based on role
      if (roles.includes("Admin")) navigate("/admin");
      else if (roles.includes("User")) navigate("/user");
      else navigate("/login"); // fallback
    } catch (err) {
      console.error(err);
      alert("Backend server failed");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Username or Email"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
