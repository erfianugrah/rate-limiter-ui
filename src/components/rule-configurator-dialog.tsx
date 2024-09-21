// RuleConfiguratorDialog.tsx
import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import RateLimitConfigurator from './RateLimitConfigurator'
import type { RuleConfig } from '@/types/ruleTypes'

interface RuleConfiguratorDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingRule: RuleConfig | null
  onSave: (config: RuleConfig) => Promise<void>
}

export function RuleConfiguratorDialog({ isOpen, onOpenChange, editingRule, onSave }: RuleConfiguratorDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 sticky top-0 bg-background z-10">
          <DialogTitle>{editingRule ? 'Edit Rule' : 'Add New Rule'}</DialogTitle>
          <DialogDescription>
            {editingRule ? 'Modify the existing rate limit rule.' : 'Create a new rate limit rule.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6">
            <RateLimitConfigurator
              initialData={editingRule || undefined}
              onSave={onSave}
              onCancel={() => onOpenChange(false)}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
