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

      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      localStorage.setItem("token", token);
      localStorage.setItem("roles", JSON.stringify(roles));

      if (roles.includes("Admin")) navigate("/admin");
      else if (roles.includes("User")) navigate("/user");
      else navigate("/login");
    } catch (err) {
      console.error(err);
      alert("Backend server failed");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side panel */}
      <div className="hidden md:flex w-1/2 bg-indigo-600 items-center justify-center text-white p-10">
        <div className="space-y-4 max-w-md">
          <h1 className="text-4xl font-bold">Welcome Back!</h1>
          <p className="text-lg">
            Sign in to access your dashboard and manage your account efficiently.
          </p>
        </div>
      </div>

      {/* Right side login form */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-50 p-8">
        <form
          onSubmit={handleLogin}
          className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-sm"
        >
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
            Login
          </h2>

          <input
            type="text"
            placeholder="Username or Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full mb-5 px-5 py-3 rounded-xl border border-gray-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full mb-6 px-5 py-3 rounded-xl border border-gray-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition"
          />

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
          >
            Log In
          </button>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Don't have an account?{" "}
            <span className="text-indigo-600 hover:underline cursor-pointer">
              Sign up
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
