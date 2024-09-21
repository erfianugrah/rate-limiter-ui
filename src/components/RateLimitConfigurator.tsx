// RateLimitConfigurator.tsx
import React, { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Clock, Fingerprint, GitBranch, Code } from 'lucide-react'
import type { RuleConfig } from '@/types/ruleTypes'
import { BasicInfoTab } from './BasicInfoTab'
import { RateLimitTab } from './RateLimitTab'
import { FingerprintTab } from './FingerprintTab'
import RuleLogicTab from './RuleLogicTab'
import { ExpressionTab } from './ExpressionTab'

interface RateLimitConfiguratorProps {
  initialData?: RuleConfig
  onSave: (config: RuleConfig) => Promise<void>
  onCancel: () => void
}

const defaultFormData: RuleConfig = {
  id: uuidv4(),
  order: 0,
  name: '',
  description: '',
  rateLimit: {
    limit: 0,
    period: 0,
  },
  fingerprint: {
    parameters: [],
  },
  initialMatch: {
    conditions: [],
    action: { type: 'rateLimit' },
  },
  elseIfActions: [],
}

export default function RateLimitConfigurator({ initialData, onSave, onCancel }: RateLimitConfiguratorProps) {
  const [formData, setFormData] = useState<RuleConfig>(() => {
    if (initialData) {
      return {
        ...defaultFormData,
        ...initialData,
        initialMatch: initialData.initialMatch || defaultFormData.initialMatch,
        elseAction: initialData.elseAction,
        elseIfActions: initialData.elseIfActions || [],
      }
    }
    return defaultFormData
  })

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        initialMatch: initialData.initialMatch || prev.initialMatch,
        elseAction: initialData.elseAction,
        elseIfActions: initialData.elseIfActions || [],
      }))
    }
  }, [initialData])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full w-full max-w-7xl mx-auto">
        <form onSubmit={handleSave}>
          <Tabs defaultValue="basic" className="flex-grow flex flex-col">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">
                <FileText className="w-4 h-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="rateLimit">
                <Clock className="w-4 h-4 mr-2" />
                Rate Limit
              </TabsTrigger>
              <TabsTrigger value="fingerprint">
                <Fingerprint className="w-4 h-4 mr-2" />
                Fingerprint
              </TabsTrigger>
              <TabsTrigger value="ruleLogic">
                <GitBranch className="w-4 h-4 mr-2" />
                Rule Logic
              </TabsTrigger>
              <TabsTrigger value="expression">
                <Code className="w-4 h-4 mr-2" />
                Expression
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-grow">
              <div className="p-6 space-y-8">
                <TabsContent value="basic">
                  <BasicInfoTab formData={formData} setFormData={setFormData} />
                </TabsContent>
                <TabsContent value="rateLimit">
                  <RateLimitTab formData={formData} setFormData={setFormData} />
                </TabsContent>
                <TabsContent value="fingerprint">
                  <FingerprintTab formData={formData} setFormData={setFormData} />
                </TabsContent>
                <TabsContent value="ruleLogic">
                  <RuleLogicTab formData={formData} setFormData={setFormData} />
                </TabsContent>
                <TabsContent value="expression">
                  <ExpressionTab formData={formData} />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
          <div className="flex justify-end space-x-4 p-4 bg-background border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Save Rule Configuration
            </Button>
          </div>
        </form>
      </div>
    </TooltipProvider>
  )
}
