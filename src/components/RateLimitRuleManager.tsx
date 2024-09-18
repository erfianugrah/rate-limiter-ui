'use client'

import { useState, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PlusCircle, Edit, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
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

interface Condition {
  field: string
  operator: string
  value: string
  headerName?: string
  headerValue?: string
}

interface ConditionGroup {
  conditions: (Condition | ConditionGroup | { type: 'operator'; logic: string })[]
}

interface FingerprintParameter {
  name: string
  headerName?: string
  headerValue?: string
  body?: string
}

interface RuleConfig {
  id: string
  order: number
  name: string
  description: string
  rateLimit: {
    limit: number
    period: number
  }
  requestMatch: ConditionGroup
  action: {
    type: string
  }
  fingerprint: {
    parameters: FingerprintParameter[]
  }
  conditionalActions: {
    conditions: (Condition | ConditionGroup | { type: 'operator'; logic: string })[]
    action: {
      type: string
    }
  }[]
}

interface SortableItemProps {
  id: string
  rule: RuleConfig
  onEdit: (rule: RuleConfig) => void
  onDelete: (id: string) => void
  isLoading: boolean
}

function SortableItem(props: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: props.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{props.rule.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-2">{props.rule.description}</p>
          <p className="text-sm">
            Rate Limit: {props.rule.rateLimit.limit} requests per {props.rule.rateLimit.period} seconds
          </p>
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={() => props.onEdit(props.rule)} className="mr-2" disabled={props.isLoading}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={props.isLoading}>
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
                  <AlertDialogAction onClick={() => props.onDelete(props.rule.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RateLimitRuleManager(): JSX.Element {
  const [rules, setRules] = useState<RuleConfig[]>([])
  const [editingRule, setEditingRule] = useState<RuleConfig | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const data = await response.json()
        setRules(Array.isArray(data.rules) ? data.rules : [])
      } else {
        throw new Error('Failed to fetch rules')
      }
    } catch (error) {
      console.error('Error fetching rules:', error)
      toast({
        title: "Error",
        description: "Failed to fetch rules. Please try again.",
        variant: "destructive",
      })
      setRules([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRule = (): void => {
    setEditingRule(null)
    setIsModalOpen(true)
  }

  const handleEditRule = (rule: RuleConfig): void => {
    setEditingRule(rule)
    setIsModalOpen(true)
  }

  const handleDeleteRule = async (ruleId: string): Promise<void> => {
    setIsLoading(true)
    const previousRules = [...rules]
    setRules(rules.filter(rule => rule.id !== ruleId))

    try {
      const response = await fetch(`/api/config/${ruleId}`, { method: 'DELETE' })
      if (response.ok) {
        toast({
          title: "Success",
          description: "Rule deleted successfully.",
        })
      } else {
        throw new Error('Failed to delete rule')
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
      setRules(previousRules)
      toast({
        title: "Error",
        description: "Failed to delete rule. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveRule = async (ruleConfig: RuleConfig): Promise<void> => {
    setIsLoading(true)
    const isNewRule = !rules.some(rule => rule.id === ruleConfig.id)
    const updatedRule = isNewRule ? { ...ruleConfig, id: uuidv4(), order: rules.length } : ruleConfig
    const previousRules = [...rules]
    const updatedRules = isNewRule ? [...rules, updatedRule] : rules.map(rule => (rule.id === updatedRule.id ? updatedRule : rule))

    setRules(updatedRules)

    try {
      const response = await fetch('/api/config', {
        method: isNewRule ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRule),
      })

      if (response.ok) {
        setIsModalOpen(false)
        toast({
          title: "Success",
          description: isNewRule ? "New rule added successfully." : "Rule updated successfully.",
        })
      } else {
        throw new Error('Failed to save rule')
      }
    } catch (error) {
      console.error('Error saving rule:', error)
      setRules(previousRules)
      toast({
        title: "Error",
        description: "Failed to save rule. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = async (event: any): Promise<void> => {
    const {active, over} = event;

    if (active.id !== over.id) {
      setRules((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });

      const updatedRules = rules.map((rule, index) => ({ ...rule, order: index }))
      
      setIsLoading(true)
      try {
        const response = await fetch('/api/config/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rules: updatedRules }),
        })

        if (response.ok) {
          toast({
            title: "Success",
            description: "Rules reordered successfully.",
          })
        } else {
          throw new Error('Failed to update rule order')
        }
      } catch (error) {
        console.error('Error updating rule order:', error)
        toast({
          title: "Error",
          description: "Failed to update rule order. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

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
            items={rules.map(rule => rule.id)}
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
