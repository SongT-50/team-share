'use client';

import { useState } from 'react';
import { DashboardStats } from '@/components/features/dashboard/DashboardStats';
import { TodoList } from '@/components/features/dashboard/TodoList';
import { RecentFiles } from '@/components/features/dashboard/RecentFiles';
import { ActivityFeed } from '@/components/features/dashboard/ActivityFeed';
import { UpcomingDeadlines } from '@/components/features/dashboard/UpcomingDeadlines';
import { QuickActions } from '@/components/features/dashboard/QuickActions';
import { TeamCreateForm } from '@/components/features/team/TeamCreateForm';
import { TeamJoinForm } from '@/components/features/team/TeamJoinForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useTeam } from '@/hooks/useTeam';
import { useFiles } from '@/hooks/useFiles';
import { useActions } from '@/hooks/useActions';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentTeam, teamId, members, isLoading: teamLoading } = useTeam();
  const { files } = useFiles(teamId);
  const { actions, todos, decisions, ideas, doneTodos, todoProgress, updateStatus } = useActions(teamId);
  const { messages, unreadCount } = useChat(teamId);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);

  if (teamLoading) return <Spinner className="py-12" />;

  // No team yet - show onboarding
  if (!currentTeam) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-2">환영합니다, {user?.name}님!</h1>
        <p className="text-gray-600 mb-8">시작하려면 팀을 만들거나 초대 코드로 합류하세요.</p>

        <div className="space-y-3">
          <Button className="w-full" size="lg" onClick={() => setShowCreateTeam(true)}>
            새 팀 만들기
          </Button>
          <Button className="w-full" size="lg" variant="secondary" onClick={() => setShowJoinTeam(true)}>
            초대 코드로 합류
          </Button>
        </div>

        <Modal isOpen={showCreateTeam} onClose={() => setShowCreateTeam(false)} title="새 팀 만들기">
          <TeamCreateForm onCreated={() => { setShowCreateTeam(false); window.location.reload(); }} />
        </Modal>

        <Modal isOpen={showJoinTeam} onClose={() => setShowJoinTeam(false)} title="팀 합류">
          <TeamJoinForm onJoined={() => { setShowJoinTeam(false); window.location.reload(); }} />
        </Modal>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Team Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{currentTeam.name}</h1>
          <span className="text-sm text-gray-500">
            초대 코드: <span className="font-mono font-bold text-blue-600">{currentTeam.inviteCode}</span>
          </span>
        </div>
        <div className="flex gap-4 mt-2">
          <span className="text-sm text-gray-500">👥 {members.length}명</span>
          {unreadCount > 0 && (
            <span className="text-sm text-blue-600">💬 {unreadCount} 안읽음</span>
          )}
          <span className="text-sm text-gray-500">📌 진행률 {todoProgress}%</span>
        </div>
      </div>

      {/* Stats */}
      <DashboardStats
        todoCount={{ done: doneTodos.length, total: todos.length }}
        fileCount={files.length}
        decisionCount={decisions.length}
        ideaCount={ideas.length}
        memberCount={members.length}
        unreadCount={unreadCount}
      />

      {/* Quick Actions */}
      <div className="mt-6">
        <QuickActions />
      </div>

      {/* Two-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-4">
            <h2 className="text-lg font-semibold mb-3">📌 진행 중인 할일</h2>
            <TodoList
              todos={todos}
              members={members}
              onToggle={(id, status) => updateStatus({ id, status })}
            />
          </div>
          <div className="bg-white rounded-xl border p-4">
            <h2 className="text-lg font-semibold mb-3">⏰ 다가오는 기한</h2>
            <UpcomingDeadlines actions={actions} members={members} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-4">
            <h2 className="text-lg font-semibold mb-3">📊 최근 활동</h2>
            <ActivityFeed messages={messages} files={files} actions={actions} />
          </div>
          <div className="bg-white rounded-xl border p-4">
            <h2 className="text-lg font-semibold mb-3">📁 최근 공유 자료</h2>
            <RecentFiles files={files} />
          </div>
        </div>
      </div>
    </div>
  );
}
