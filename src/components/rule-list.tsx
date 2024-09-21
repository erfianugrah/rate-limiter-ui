// src/components/rule-list.tsx
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './sortable-item';
import type { RuleConfig } from '@/types/ruleTypes';

interface RuleListProps {
  rules: RuleConfig[];
  onReorder: (event: DragEndEvent) => Promise<void>;
  onEdit: (rule: RuleConfig) => void;
  onDelete: (id: string) => Promise<void>;
  onRevert: (ruleId: string, targetVersion: number) => Promise<void>;
  isLoading: boolean;
}

export function RuleList({ rules, onReorder, onEdit, onDelete, onRevert, isLoading }: RuleListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onReorder}
    >
      <SortableContext
        items={rules.map((rule) => rule.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-4">
          {rules.map((rule) => (
            <li key={rule.id}>
              <SortableItem
                id={rule.id}
                name={rule.name}
                description={rule.description}
                rateLimit={`${rule.rateLimit.limit}/${rule.rateLimit.period}s`}
                version={rule.version}
                onEdit={() => onEdit(rule)}
                onDelete={() => onDelete(rule.id)}
                onRevert={onRevert}
                isLoading={isLoading}
              />
            </li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
