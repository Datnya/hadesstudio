import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        if (res?.error) setError("Email o contraseña incorrectos");
        else router.push("/");
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-5 text-white">
            <Head>
                <title>Hades · Ingresar</title>
            </Head>
            <div className="w-full max-w-md bg-gray-900/50 border border-gray-800 p-10 rounded-3xl backdrop-blur-xl text-center shadow-2xl">
                <div className="flex justify-center items-center gap-3 mb-1">
                    <svg width="40" height="40" viewBox="0 0 64 64" fill="#00D056">
                        <path d="M12 12 L24 24 L40 24 L52 12 V32 Q52 48 32 52 Q12 48 12 32 Z" />
                        <circle cx="24" cy="30" r="3" fill="black" />
                        <circle cx="40" cy="30" r="3" fill="black" />
                    </svg>
                    <span className="text-2xl font-[900] tracking-tight">Hades <span className="text-[#00D056]">Studio</span></span>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-[4px] mb-10">Subtitle Engine & Video Editor</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email" placeholder="Correo electrónico" required
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 p-4 rounded-xl text-sm focus:border-[#00D056] outline-none transition-colors"
                    />
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"} placeholder="Contraseña" required
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 p-4 rounded-xl text-sm focus:border-[#00D056] outline-none transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            )}
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                    <button type="submit" className="w-full bg-[#00D056] text-black font-extrabold p-4 rounded-xl uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#00D056]/10">INGRESAR A HADES</button>
                </form>

                <p className="mt-8 text-xs text-gray-500">¿No tienes cuenta? <a href="/register" className="text-[#00D056] font-bold hover:underline">Regístrate aquí</a></p>

                <div className="my-8 flex items-center gap-4 text-gray-800">
                    <div className="flex-1 h-px bg-gray-800"></div>
                    <span className="text-[10px] font-bold text-gray-600">O</span>
                    <div className="flex-1 h-px bg-gray-800"></div>
                </div>

                <button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="w-full border border-gray-800 p-4 rounded-xl flex items-center justify-center gap-3 text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
                    Iniciar con Google
                </button>
            </div>
        </div>
    );
}
