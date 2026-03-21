import { useState } from 'react';
import { toggleReaction } from '../api';
import type { Reaction } from '../types';

const EMOJIS = [
  { emoji: 'heart', display: '\u2764\uFE0F' },
  { emoji: 'star', display: '\uD83C\uDF1F' },
  { emoji: 'laugh', display: '\uD83D\uDE02' },
  { emoji: 'fire', display: '\uD83D\uDD25' },
  { emoji: 'angry', display: '\uD83D\uDE20' },
];

interface ReactionBarProps {
  targetType: string;
  targetId: string;
  initial?: Reaction[];
}

export default function ReactionBar({ targetType, targetId, initial = [] }: ReactionBarProps) {
  const [reactions, setReactions] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const r of initial) map[r.emoji] = r.count;
    return map;
  });

  const handleClick = async (emoji: string) => {
    const result = await toggleReaction(targetType, targetId, emoji) as { action: string };
    setReactions((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + (result.action === 'added' ? 1 : -1),
    }));
  };

  return (
    <div className="reactions">
      {EMOJIS.map(({ emoji, display }) => {
        const count = reactions[emoji] || 0;
        if (count <= 0 && initial.length > 0 && !initial.find((r) => r.emoji === emoji)) return null;
        return (
          <button key={emoji} className="reaction-btn" onClick={() => handleClick(emoji)}>
            {display} {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
