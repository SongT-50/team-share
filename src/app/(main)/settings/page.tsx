'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { useNotificationStore } from '@/stores/notification-store';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { currentTeam, members } = useTeam();
  const { settings, toggleSetting } = useNotificationStore();
  const [name, setName] = useState(user?.name || '');

  if (!user) return null;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">설정</h1>

      <div className="space-y-6">
        {/* Profile */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">프로필</h2>
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={user.name} src={user.profileImage} size="lg" />
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <Input
            label="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button className="mt-3" size="sm" disabled={name === user.name}>
            이름 변경
          </Button>
        </section>

        {/* Team Info */}
        {currentTeam && (
          <section className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">팀 정보</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">팀 이름</span>
                <span>{currentTeam.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">초대 코드</span>
                <span className="font-mono font-bold text-blue-600">{currentTeam.inviteCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">팀원 수</span>
                <span>{members.length}명</span>
              </div>
            </div>
          </section>
        )}

        {/* Notification Settings */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">알림 설정</h2>
          <div className="space-y-4">
            {([
              { key: 'chat' as const, label: '채팅 알림', description: '새 메시지 수신 시 알림' },
              { key: 'file' as const, label: '파일 알림', description: '새 파일 업로드 시 알림' },
              { key: 'action' as const, label: '액션 알림', description: '액션 할당/상태 변경 시 알림' },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={settings[item.key]}
                  onClick={() => toggleSetting(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings[item.key] ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Logout */}
        <Button variant="danger" className="w-full" onClick={logout}>
          로그아웃
        </Button>
      </div>
    </div>
  );
}
