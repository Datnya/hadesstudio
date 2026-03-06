import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
        if (data.success) {
            router.push("/login?message=Account+created");
        } else {
            setError(data.error || "Algo salió mal");
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-5 text-white font-sans">
            <div className="w-full max-w-md bg-gray-950 p-10 rounded-3xl border border-gray-800 shadow-2xl">
                <h1 className="text-2xl font-bold mb-8 text-center uppercase tracking-widest text-[#00D056]">Nueva Cuenta</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        placeholder="Username (Datnya)" required
                        value={username} onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 p-4 rounded-xl text-sm outline-none focus:border-[#00D056] transition-all"
                    />
                    <input
                        type="email" placeholder="Email" required
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 p-4 rounded-xl text-sm outline-none focus:border-[#00D056] transition-all"
                    />
                    <input
                        type="password" placeholder="Password" required
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 p-4 rounded-xl text-sm outline-none focus:border-[#00D056] transition-all"
                    />
                    {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                    <button type="submit" className="w-full bg-[#00D056] text-black font-extrabold p-4 rounded-xl uppercase text-xs tracking-widest shadow-lg shadow-[#00D056]/10">CREAR CUENTA</button>
                </form>

                <p className="mt-8 text-xs text-center text-gray-500">¿Ya tienes cuenta? <a href="/login" className="text-[#00D056] font-bold hover:underline">Inicia sesión</a></p>
            </div>
        </div>
    );
}
