'use client';

import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';

export function MobileHeader() {
  const { teams, currentTeam, switchTeam } = useTeam();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white border-b px-4 py-2 flex items-center justify-between">
      <span className="text-sm font-bold text-blue-600">Team Share</span>
      {teams.length > 1 ? (
        <select
          value={currentTeam?.id || ''}
          onChange={(e) => switchTeam(e.target.value)}
          className="text-sm border rounded-lg px-2 py-1 bg-gray-50 max-w-[160px] truncate"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      ) : currentTeam ? (
        <span className="text-sm text-gray-500 truncate max-w-[160px]">{currentTeam.name}</span>
      ) : null}
    </header>
  );
}
