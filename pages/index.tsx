import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (status === 'authenticated') loadProjects();
    }, [status]);

    async function loadProjects() {
        try {
            const res = await fetch(`/api/list-projects?userId=${(session?.user as any)?.id || 'invitado'}`);
            const data = await res.json();
            setProjects((data || []).slice(0, 3));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    if (status === 'loading') return <div className="min-h-screen bg-black flex items-center justify-center text-white">Sincronizando con Hades Studio...</div>;

    return (
        <div className="min-h-screen bg-black text-white font-sans p-10">
            <Head>
                <title>Hades · Centro de Control</title>
            </Head>

            <header className="max-w-6xl mx-auto flex justify-between items-end mb-12 border-b border-gray-800 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">HOLA <span className="text-[#00D056]">{(session?.user as any)?.name?.toUpperCase() || 'DATNYA'}</span></h1>
                    <p className="text-gray-500 font-semibold text-sm mt-1 uppercase tracking-widest">Bienvenido a Hades Studio</p>
                    <p className="text-gray-400 text-xs mt-1">Centro de Control de Proyectos</p>
                </div>
                <div className="flex items-center gap-5">
                    <span className="text-xs text-gray-400 bg-gray-900 px-3 py-1 rounded">MASTER ACCOUNT</span>
                    <button onClick={() => signOut()} className="text-red-500 text-xs font-bold hover:underline">CERRAR SESIÓN</button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1.2fr,1fr] gap-14">
                <section className="bg-gray-900 border border-gray-800 rounded-3xl p-10">
                    <h2 className="text-xl font-bold mb-8">Nuevo Video</h2>
                    <div className="border-2 border-dashed border-gray-700 rounded-2xl p-20 text-center cursor-pointer hover:border-[#00D056] transition-all">
                        <span className="text-4xl block mb-4">🎞️</span>
                        <p className="text-gray-400 text-sm">Arrastra tu video aquí</p>
                        <p className="text-gray-600 text-[10px] mt-2 tracking-wide uppercase font-bold">Soporte para 9:16 vertical</p>
                        <button
                            onClick={() => router.push('/editor')}
                            className="mt-8 bg-[#00D056] text-black font-extrabold px-10 py-3 rounded-full uppercase text-xs tracking-tight shadow-lg shadow-[#00D056]/20 transition-transform active:scale-95"
                        >
                            Comenzar Edición
                        </button>
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Proyectos Recientes</h2>
                        <span className="text-xs text-[#00D056] font-bold cursor-pointer hover:underline">VER TODOS</span>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-gray-600 text-xs text-center p-10">Buscando en la base de datos...</div>
                        ) : projects.length === 0 ? (
                            <div className="bg-gray-950 border border-dashed border-gray-800 p-10 rounded-2xl text-center text-gray-500 text-xs">No hay proyectos activos</div>
                        ) : projects.map((p: any) => (
                            <div key={p.fileName} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between hover:border-gray-600 transition-colors cursor-pointer" onClick={() => router.push(`/editor?id=${p.fileName}`)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-xl shadow-inner">🎬</div>
                                    <div>
                                        <p className="font-bold text-sm">{p.name}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">{p.savedAt}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
