import { Search, Bell, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

export default function TopBar({ title = 'Dashboard' }) {
    const { theme, toggleTheme } = useThemeStore();
    const user = useAuthStore((s) => s.user);

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <header className="flex items-center justify-between px-6 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid hsl(240 6% 13%)', background: 'hsl(240 10% 7%)' }}>

            {/* Title */}
            <h1 className="text-base font-bold text-white">{title}</h1>

            {/* Search */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm flex-1 max-w-xs mx-6"
                style={{ background: 'hsl(240 6% 12%)', border: '1px solid hsl(240 6% 18%)', color: 'hsl(240 5% 50%)' }}>
                <Search className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Search or press Cmd+K...</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg transition-colors hover:text-white"
                    style={{ color: 'hsl(240 5% 55%)', background: 'hsl(240 6% 12%)' }}>
                    <Bell className="w-4 h-4" />
                </button>
                <button onClick={toggleTheme}
                    className="p-2 rounded-lg transition-colors hover:text-white"
                    style={{ color: 'hsl(240 5% 55%)', background: 'hsl(240 6% 12%)' }}>
                    {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ml-1 cursor-pointer"
                    style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }}>
                    {initials}
                </div>
            </div>
        </header>
    );
}
