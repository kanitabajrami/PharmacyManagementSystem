import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const navigate = useNavigate();
const API_BASE = import.meta.env.VITE_API_BASE;

const handleLogin = async (e) => {
e.preventDefault();
setLoading(true);

try {
const response = await fetch(`${API_BASE}/api/auth/login`, {
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
<div className="min-h-screen bg-gray-50">
    <div className="min-h-screen flex">
        {/* LEFT: simple panel */}
        <div className="hidden md:flex w-1/2 items-center justify-center p-12">
            <div className="w-full max-w-md">
                <div className="flex items-center gap-3">
                    <div
                        className="h-11 w-11 rounded-2xl border border-gray-200 bg-white grid place-items-center shadow-sm">
                        <span className="text-gray-900 font-semibold">P</span>
                    </div>
                    <div>

                        <div className="text-xl font-semibold text-gray-900">
                            Pharmacy Management
                        </div>
                    </div>
                </div>





                {/* Subtle big shape */}
                <div className="mt-10 relative">
                    <div className="h-40 rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-indigo-100 via-indigo-500 to-indigo-100" />
                        <div className="p-5">
                            <div className="text-sm font-semibold text-gray-900">
                                Keep everything organized
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                Sign in to manage medicines, prescriptions, invoices, suppliers, and users.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: login */}
        <div className="flex w-full md:w-1/2 items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md">
                <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    {/* subtle top accent */}
                    <div className="h-1 bg-gradient-to-r from-indigo-100 via-indigo-500 to-indigo-100" />


                    {/* header */}
                    <div className="px-8 pt-8 pb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">Login</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Welcome back — sign in to continue
                        </p>
                    </div>

                    <div className="border-t border-gray-100" />

                    <form onSubmit={handleLogin} className="px-8 py-7 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username or Email
                            </label>
                            <input type="text" placeholder="e.g. blenda" value={username} onChange={(e)=>
                            setUsername(e.target.value)}
                            required
                            className="w-full h-11 px-3 rounded-xl border border-gray-300 bg-white text-sm
                             outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>

                            </div>
                            <input type="password" placeholder="••••••••" value={password} onChange={(e)=>
                            setPassword(e.target.value)}
                            required
                            className="w-full h-11 px-3 rounded-xl border border-gray-300 bg-white text-sm
                             outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition"
                            />
                        </div>



                        <button type="submit" disabled={loading}
                            className="mt-2 w-full h-11 rounded-xl font-semibold text-white bg-indigo-600
           hover:bg-indigo-700 active:scale-[0.99]
           disabled:opacity-60 disabled:cursor-not-allowed transition">
                            {loading ? "Logging in..." : "Log In"}
                        </button>

                        <div className="pt-2 text-center text-sm text-gray-600">
                            Don’t have an account?{" "}
                            <button type="button" onClick={()=> navigate("/register")}
                                className="font-semibold text-gray-900 hover:text-gray-700 transition"
                                >
                                Register
                            </button>
                        </div>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-gray-400">
                    © {new Date().getFullYear()} Pharmacy Management System
                </p>
            </div>
        </div>
    </div>
</div>
);

}
