import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { useRuleStore } from '@/store/ruleStore'
import type { RuleConfig } from '@/types/ruleTypes'
import { ThemeToggle } from './theme-toggle'
import { RuleList } from './rule-list'
import { AddRuleButton } from './add-rule-button'
import { RuleConfiguratorDialog } from './rule-configurator-dialog'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

export default function RateLimitRuleManager() {
  const { rules, isLoading, fetchRules, addRule, updateRule, deleteRule, reorderRules, revertRule } = useRuleStore()
  const [editingRule, setEditingRule] = useState<RuleConfig | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const { toast } = useToast()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    fetchRules().catch((error: Error) => {
      console.error('Error fetching rules:', error);
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
        description: `Failed to delete rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      await fetchRules()
    } catch (error) {
      console.error('Error saving rule:', error)
      toast({
        title: "Error",
        description: `Failed to save rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }, [editingRule, updateRule, addRule, fetchRules, toast])

  const handleRevertRule = useCallback(async (ruleId: string, targetVersion: number): Promise<void> => {
    try {
      await revertRule(ruleId, targetVersion)
      toast({
        title: "Success",
        description: `Rule reverted to version ${targetVersion} successfully.`,
      })
      await fetchRules()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to revert rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }, [revertRule, fetchRules, toast])

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
          description: `Failed to update rule order: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        })
      }
    }
  }, [rules, reorderRules, toast])

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      localStorage.setItem('theme', newTheme)
      return newTheme
    })
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Rate Limit Rules</h1>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
      <AddRuleButton onClick={handleAddRule} isLoading={isLoading} />
      {rules.length > 0 ? (
        <RuleList
          rules={rules}
          onEdit={handleEditRule}
          onDelete={handleDeleteRule}
          onReorder={handleDragEnd}
          onRevert={handleRevertRule}
          isLoading={isLoading}
        />
      ) : (
        <p className="text-center text-gray-500 mt-4">No rules found. Add a new rule to get started.</p>
      )}
      <RuleConfiguratorDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingRule={editingRule}
        onSave={handleSaveRule}
        onRevert={handleRevertRule}
      />
    </div>
  )
}
