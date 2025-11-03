import React, { useState, useRef, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const UserMenu: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hook siempre se llama, sin importar si hay usuario o no
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Solo cerrar si hay menú abierto y hay usuario
      if (user && open && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [user, open]);

  if (!user) return null; // Condicional después de los hooks

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 py-4 px-6 rounded-full bg-gray-100 hover:bg-gray-200 transition"
      >
        <User className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{user.name.split(" ")[0]}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 shadow-lg rounded-xl z-50">
          <div className="p-3 border-b text-xs text-gray-500">
            <p className="truncate">{user.email}</p>
            <p className="font-semibold text-gray-700 capitalize">{user.role.toLowerCase()}</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
