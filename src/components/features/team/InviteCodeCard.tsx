'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface InviteCodeCardProps {
  inviteCode: string;
  isAdmin: boolean;
  onRegenerate: () => Promise<unknown>;
  isRegenerating: boolean;
}

export function InviteCodeCard({
  inviteCode,
  isAdmin,
  onRegenerate,
  isRegenerating,
}: InviteCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">초대 코드</h3>
      <div className="flex items-center justify-center gap-1 mb-4">
        {inviteCode.split('').map((char, i) => (
          <span
            key={i}
            className="w-10 h-12 flex items-center justify-center bg-gray-50 border rounded-lg text-xl font-mono font-bold text-blue-600"
          >
            {char}
          </span>
        ))}
      </div>
      <p className="text-xs text-gray-500 text-center mb-4">
        이 코드를 팀원에게 공유하면 팀에 합류할 수 있습니다.
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={handleCopy}
        >
          {copied ? '복사됨!' : '코드 복사'}
        </Button>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRegenerate()}
            isLoading={isRegenerating}
          >
            재생성
          </Button>
        )}
      </div>
    </div>
  );
}
