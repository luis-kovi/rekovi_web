'use client'

import { Card } from '@/types'

interface DebugInfoProps {
  cards: Card[];
  permissionType?: string;
  userEmail?: string;
}

export default function DebugInfo({ cards, permissionType, userEmail }: DebugInfoProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>Cards: {cards.length}</div>
        <div>Permission: {permissionType}</div>
        <div>Email: {userEmail}</div>
        <div className="mt-2">
          <div className="font-semibold">Cards Data:</div>
          <pre className="text-xs overflow-auto max-h-32">
            {JSON.stringify(cards.slice(0, 2), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 
