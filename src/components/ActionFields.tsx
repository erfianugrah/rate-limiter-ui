// ActionFields.tsx
import React from 'react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { ConditionalAction } from '@/types/ruleTypes'

interface ActionFieldsProps {
  action: ConditionalAction['action']
  updateAction: (newAction: ConditionalAction['action']) => void
}

export function ActionFields({ action, updateAction }: ActionFieldsProps) {
  if (action.type !== 'customResponse') return null

  return (
    <div className="space-y-4">
      <div>
        <Label>HTTP Status Code</Label>
        <Input
          type="number"
          value={action.statusCode || ''}
          onChange={(e) => updateAction({ ...action, statusCode: parseInt(e.target.value) })}
          placeholder="Enter HTTP status code"
        />
      </div>
      <div>
        <Label>Response Body Type</Label>
        <RadioGroup
          value={action.bodyType || 'text'}
          onValueChange={(value: 'text' | 'json' | 'html') => updateAction({ ...action, bodyType: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="text" id="text" />
            <Label htmlFor="text">Text</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="json" id="json" />
            <Label htmlFor="json">JSON</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="html" id="html" />
            <Label htmlFor="html">HTML</Label>
          </div>
        </RadioGroup>
      </div>
      <div>
        <Label>Response Body</Label>
        <Textarea
          value={action.body || ''}
          onChange={(e) => updateAction({ ...action, body: e.target.value })}
          placeholder={`Enter ${action.bodyType || 'text'} response body`}
        />
      </div>
    </div>
  )
}
