import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("https://localhost:7201/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userNameOrEmail: username, password }),
      });

      if (!response.ok) {
        alert("Invalid username or password");
        return;
      }

      const data = await response.json();
      const token = data.token;

      const payload = JSON.parse(atob(token.split(".")[1]));
      const roles =
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      localStorage.setItem("token", token);
      localStorage.setItem("roles", JSON.stringify(roles));

      if (roles?.includes("Admin")) navigate("/admin");
      else if (roles?.includes("User")) navigate("/user");
      else navigate("/login");
    } catch (err) {
      console.error(err);
      alert("Backend server failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="min-h-screen flex">
        {/* Left side panel */}
        <div className="hidden md:flex w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-700" />
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex h-full w-full items-center justify-center p-12 text-white">
            <div className="max-w-md space-y-5">
              <h1 className="text-4xl font-extrabold tracking-tight">
                Welcome Back!
              </h1>
              <p className="text-white/90 text-lg leading-relaxed">
                Sign in to access your dashboard and manage your pharmacy system
                efficiently.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <div className="font-semibold">Secure</div>
                  <div className="text-white/80">JWT authentication</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <div className="font-semibold">Fast</div>
                  <div className="text-white/80">Role-based access</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side login form */}
        <div className="flex w-full md:w-1/2 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-6 text-center md:hidden">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-sm text-gray-500 mt-1">
                Sign in to continue
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="bg-white shadow-xl ring-1 ring-black/5 rounded-3xl p-8 sm:p-10"
            >
              <div className="hidden md:block text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Login</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your credentials to continue
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. blenda"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-sm rounded-xl border border-gray-300 bg-white
                               focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20
                               outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-sm rounded-xl border border-gray-300 bg-white
                               focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20
                               outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-semibold text-white shadow-lg
                             bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]
                             disabled:opacity-60 disabled:cursor-not-allowed
                             transition"
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>
                <div className="mt-6 text-center text-sm text-gray-600">
                  Don’t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 transition"
                  >
                    Register
                  </button>
                </div>
              </div>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} Pharmacy Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
