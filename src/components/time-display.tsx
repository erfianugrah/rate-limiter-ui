import React from 'react';

interface TimeDisplayProps {
  seconds: number;
}

export function TimeDisplay({ seconds }: TimeDisplayProps) {
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    const parts = [];
    if (hours > 0) {
      parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    }
    if (remainingSeconds > 0 || parts.length === 0) {
      parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
    }

    return parts.join(' ');
  };

  return <span>{formatTime(seconds)}</span>;
}
