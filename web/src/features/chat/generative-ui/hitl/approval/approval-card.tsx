'use client';

import { memo, useCallback, useState } from 'react';

interface ApprovalCardProps {
  title: string;
  status: 'inProgress' | 'executing' | 'complete';
  respond?: (response: { accepted: boolean }) => void;
}

export const ApprovalCard = memo(({ title, status, respond }: ApprovalCardProps) => {
  const [decision, setDecision] = useState<'allowed' | 'aborted' | null>(null);

  const handleAllow = useCallback(() => {
    setDecision('allowed');
    respond?.({ accepted: true });
  }, [respond]);

  const handleAbort = useCallback(() => {
    setDecision('aborted');
    respond?.({ accepted: false });
  }, [respond]);

  return (
    <div className="mt-6 w-full max-w-md rounded-2xl bg-cyan-500 shadow-xl">
      <div className="w-full rounded-2xl bg-white/20 p-8 backdrop-blur-md">
        {decision === 'allowed' ? (
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-white">🚀 Allowed</h2>
          </div>
        ) : decision === 'aborted' ? (
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-white">✋ Aborted</h2>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-bold text-white">{title}</h2>
            </div>

            {status === 'executing' && decision === null && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAllow}
                  className="flex-1 rounded-xl bg-white px-6 py-4 font-bold text-black shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
                >
                  🚀 Allow!
                </button>
                <button
                  type="button"
                  onClick={handleAbort}
                  className="flex-1 rounded-xl border-2 border-white/30 bg-black/20 px-6 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-black/30 active:scale-95"
                >
                  ✋ Abort
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

ApprovalCard.displayName = 'ApprovalCard';
