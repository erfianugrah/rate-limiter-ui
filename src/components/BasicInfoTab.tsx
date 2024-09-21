// BasicInfoTab.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LABELS } from './config-variables'
import type { RuleConfig } from '@/types/ruleTypes'

interface BasicInfoTabProps {
  formData: RuleConfig
  setFormData: React.Dispatch<React.SetStateAction<RuleConfig>>
}

export function BasicInfoTab({ formData, setFormData }: BasicInfoTabProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Provide general information about the rule.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{LABELS.RULE_NAME}</Label>
          <Input 
            type="text" 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleInputChange}
            placeholder="Enter rule name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{LABELS.DESCRIPTION}</Label>
          <Textarea 
            id="description" 
            name="description" 
            value={formData.description} 
            onChange={handleInputChange}
            placeholder="Enter rule description"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  )
}
