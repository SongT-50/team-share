'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { bkend } from '@/lib/bkend';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage, ActionType } from '@/types';

interface ActionConverterProps {
  message: ChatMessage;
  teamId: string;
  onClose: () => void;
}

const actionLabels: Record<ActionType, { icon: string; label: string }> = {
  todo: { icon: '☑', label: '할일' },
  decision: { icon: '📋', label: '의사결정' },
  idea: { icon: '💡', label: '아이디어' },
};

export function ActionConverter({ message, teamId, onClose }: ActionConverterProps) {
  const [selectedType, setSelectedType] = useState<ActionType | null>(null);
  const [title, setTitle] = useState(message.content.slice(0, 50));
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const handleCreate = async () => {
    if (!selectedType || !user) return;

    setIsCreating(true);
    try {
      await bkend.collection('action-items').create({
        teamId,
        sourceMessageId: message._id,
        creatorId: user._id,
        actionType: selectedType,
        title: title.trim() || message.content.slice(0, 50),
        content: message.content,
        status: 'open',
        tags: [],
      });

      toast.success(`${actionLabels[selectedType].label}로 변환되었습니다`);
      onClose();
    } catch {
      toast.error('변환에 실패했습니다');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mt-2 bg-white border rounded-lg shadow-lg p-3 min-w-[250px]">
      <p className="text-xs text-gray-500 mb-2">메시지를 액션으로 변환</p>

      <div className="flex gap-2 mb-3">
        {(Object.entries(actionLabels) as [ActionType, { icon: string; label: string }][]).map(
          ([type, { icon, label }]) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                selectedType === type
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              {icon} {label}
            </button>
          )
        )}
      </div>

      {selectedType && (
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="w-full px-2 py-1.5 border rounded text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} isLoading={isCreating}>
              변환
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
