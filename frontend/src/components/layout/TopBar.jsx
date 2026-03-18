import { Search, Bell, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

export default function TopBar({ title = 'Dashboard' }) {
    const { theme, toggleTheme } = useThemeStore();
    const user = useAuthStore((s) => s.user);

    return (
        <header className="flex items-center justify-between px-8 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--active-highlight)', background: 'var(--main-bg)' }}>

            {/* Title */}
            <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>

            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm flex-1 max-w-md mx-8 transition-all hover:bg-[var(--active-highlight)]"
                style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--active-highlight)', color: 'var(--text-muted)' }}>
                <Search className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Search or press Cmd+K...</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button className="p-2.5 rounded-xl transition-all hover:text-white hover:bg-[var(--active-highlight)]"
                    style={{ color: 'var(--text-muted)' }}>
                    <Bell className="w-5 h-5" />
                </button>
                <button onClick={toggleTheme}
                    className="p-2.5 rounded-xl transition-all hover:text-white hover:bg-[var(--active-highlight)]"
                    style={{ color: 'var(--text-muted)' }}>
                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--active-highlight)] ml-2 cursor-pointer transition-transform hover:scale-105">
                     <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Ayush'}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </header>
    );
}

