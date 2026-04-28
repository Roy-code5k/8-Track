import NotificationDropdown from '../dashboard/NotificationDropdown';
import { useAuthStore } from '../../store/authStore';

export default function TopBar({ title = 'Dashboard' }) {
    const user = useAuthStore((s) => s.user);

    return (
        <header className="flex items-center justify-between px-8 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--active-highlight)', background: 'var(--main-bg)' }}>

            {/* Title */}
            <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>


            {/* Actions */}
            <div className="flex items-center gap-3">
                <NotificationDropdown />
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--active-highlight)] ml-2 cursor-pointer transition-transform hover:scale-105">
                     <img 
                        src={`https://api.dicebear.com/7.x/${user?.avatarStyle || 'avataaars'}/svg?seed=${user?.avatarSeed || user?.name || 'User'}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </header>
    );
}

