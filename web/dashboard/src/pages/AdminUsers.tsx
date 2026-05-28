import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "@/config/api";
import { toast } from "sonner";
import { Trash2, Users, ArrowLeft } from "lucide-react";

interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  facultad: string;
}

export const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("ssiu_token");
      const res = await fetch(`${API_URL}/auth/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("No se pudieron cargar los usuarios");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error("Error", { description: "Hubo un problema al cargar los usuarios." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      const token = localStorage.getItem("ssiu_token");
      const res = await fetch(`${API_URL}/auth/users/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      toast.success("Usuario eliminado exitosamente");
      loadUsers();
    } catch (error) {
      toast.error("Error al eliminar usuario");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans">
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center gap-4 px-6 h-16 max-w-7xl mx-auto w-full">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Administración de Usuarios
            </h1>
            <p className="text-xs text-slate-400 font-medium">Gestiona estudiantes, guardias y administradores</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900 border-b border-slate-800 font-bold text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Correo</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Facultad</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">#{u.id}</td>
                      <td className="px-6 py-4 font-medium text-white">{u.nombre}</td>
                      <td className="px-6 py-4 text-slate-400">{u.correo}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${
                          u.rol === "Administrador" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                          u.rol === "Guardia" ? "bg-orange-500/15 text-orange-400 border-orange-500/30" :
                          "bg-blue-500/15 text-blue-400 border-blue-500/30"
                        }`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{u.facultad}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
