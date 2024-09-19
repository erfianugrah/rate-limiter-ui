'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PlusCircle, Edit, Trash2, GripVertical } from 'lucide-react'
import RateLimitConfigurator from './RateLimitConfigurator'
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRuleStore } from '@/store/ruleStore'
import type { RuleConfig } from '@/types/ruleTypes'

interface SortableItemProps {
  id: string
  rule: RuleConfig
  onEdit: (rule: RuleConfig) => void
  onDelete: (id: string) => void
  isLoading: boolean
}

function SortableItem({ id, rule, onEdit, onDelete, isLoading }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    onDelete(id);
    setIsDeleteDialogOpen(false);
  }, [id, onDelete]);

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center space-x-4 pb-2">
          <div {...attributes} {...listeners} className="cursor-move">
            <GripVertical className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex-grow">
            <CardTitle className="text-lg font-semibold">{rule.name}</CardTitle>
            <p className="text-sm text-gray-500">{rule.description}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p className="text-sm">
              Rate Limit: {rule.rateLimit.limit} requests per {rule.rateLimit.period} seconds
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(rule)} disabled={isLoading}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" onClick={handleDeleteClick} disabled={isLoading}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this rule?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the rate limit rule.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RateLimitRuleManager() {
  const { rules, isLoading, fetchRules, addRule, updateRule, deleteRule, reorderRules } = useRuleStore()
  const [editingRule, setEditingRule] = useState<RuleConfig | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const { toast } = useToast()

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

  useEffect(() => {
    fetchRules().catch((error: Error) => {
      toast({
        title: "Error",
        description: `Failed to fetch rules: ${error.message}`,
        variant: "destructive",
      })
    })
  }, [fetchRules, toast])

  const handleAddRule = useCallback((): void => {
    setEditingRule(null)
    setIsModalOpen(true)
  }, [])

  const handleEditRule = useCallback((rule: RuleConfig): void => {
    setEditingRule(rule)
    setIsModalOpen(true)
  }, [])

  const handleDeleteRule = useCallback(async (ruleId: string): Promise<void> => {
    try {
      await deleteRule(ruleId)
      toast({
        title: "Success",
        description: "Rule deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete rule: ${(error as Error).message}`,
        variant: "destructive",
      })
    }
  }, [deleteRule, toast])

const handleSaveRule = useCallback(async (config: RuleConfig): Promise<void> => {
  try {
    if (editingRule) {
      await updateRule(config)
    } else {
      const { id, order, ...newRule } = config
      await addRule(newRule as Omit<RuleConfig, 'id' | 'order'>)
    }
    setIsModalOpen(false)
    toast({
      title: "Success",
      description: editingRule ? "Rule updated successfully." : "New rule added successfully.",
    })
  } catch (error) {
    toast({
      title: "Error",
      description: `Failed to save rule: ${(error as Error).message}`,
      variant: "destructive",
    })
  }
}, [editingRule, updateRule, addRule, toast])

  const handleDragEnd = useCallback(async (event: DragEndEvent): Promise<void> => {
    const {active, over} = event;

    if (active.id !== over?.id) {
      const oldIndex = rules.findIndex((item) => item.id === active.id);
      const newIndex = rules.findIndex((item) => item.id === over?.id);
      
      const newRules = arrayMove(rules, oldIndex, newIndex).map((rule, index) => ({ ...rule, order: index }));
      
      try {
        await reorderRules(newRules)
        toast({
          title: "Success",
          description: "Rules reordered successfully.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to update rule order: ${(error as Error).message}`,
          variant: "destructive",
        })
      }
    }
  }, [rules, reorderRules, toast])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Rate Limit Rules</h1>
      <Button onClick={handleAddRule} className="mb-4" disabled={isLoading}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Rule
      </Button>
      {rules.length > 0 ? (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
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
                onEdit={handleEditRule}
                onDelete={handleDeleteRule}
                isLoading={isLoading}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <p>No rules found. Add a new rule to get started.</p>
      )}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Add New Rule'}</DialogTitle>
            <DialogDescription>
              {editingRule ? 'Modify the existing rate limit rule.' : 'Create a new rate limit rule.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <RateLimitConfigurator
              initialData={editingRule || undefined}
              onSave={handleSaveRule}
              onCancel={() => setIsModalOpen(false)}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
