import React from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableItem } from './sortable-item'
import type { RuleConfig } from '@/types/ruleTypes'

interface RuleListProps {
  rules: RuleConfig[]
  onEdit: (rule: RuleConfig) => void
  onDelete: (id: string) => void
  onReorder: (event: DragEndEvent) => void
  isLoading: boolean
}

export function RuleList({ rules, onEdit, onDelete, onReorder, isLoading }: RuleListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
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
        {rules.map((rule) => (
          <SortableItem 
            key={rule.id} 
            id={rule.id}
            rule={rule}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={isLoading}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
