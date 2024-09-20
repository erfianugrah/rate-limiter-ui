import React, { useState, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Edit, Trash2, GripVertical } from 'lucide-react'
import type { RuleConfig } from '@/types/ruleTypes'
import { TimeDisplay } from './time-display'

interface SortableItemProps {
  id: string
  rule: RuleConfig
  onEdit: (rule: RuleConfig) => void
  onDelete: (id: string) => void
  isLoading: boolean
}

const formatRequestCount = (count: number): string => {
  if (count >= 1e9) return (count / 1e9).toFixed(1) + 'b'
  if (count >= 1e6) return (count / 1e6).toFixed(1) + 'm'
  if (count >= 1e3) return (count / 1e3).toFixed(1) + 'k'
  return count.toString()
}

export function SortableItem({ id, rule, onEdit, onDelete, isLoading }: SortableItemProps) {
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

  const formattedRequestCount = formatRequestCount(rule.rateLimit.limit);

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
              Rate Limit: {formattedRequestCount} request{rule.rateLimit.limit !== 1 ? 's' : ''} per <TimeDisplay seconds={rule.rateLimit.period} />
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
