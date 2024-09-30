import React, { useState, useEffect } from 'react'
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
  const [nameCharCount, setNameCharCount] = useState(0)
  const [descriptionCharCount, setDescriptionCharCount] = useState(0)

  const MAX_NAME_LENGTH = 50
  const MAX_DESCRIPTION_LENGTH = 200

  useEffect(() => {
    setNameCharCount(formData.name.length)
    setDescriptionCharCount(formData.description.length)
  }, [formData.name, formData.description])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const newValue = name === 'name' ? value.slice(0, MAX_NAME_LENGTH) : value.slice(0, MAX_DESCRIPTION_LENGTH)
    setFormData((prev) => ({ ...prev, [name]: newValue }))
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
            maxLength={MAX_NAME_LENGTH}
          />
          <p className="text-sm text-muted-foreground">
            {nameCharCount}/{MAX_NAME_LENGTH} characters
          </p>
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
            maxLength={MAX_DESCRIPTION_LENGTH}
          />
          <p className="text-sm text-muted-foreground">
            {descriptionCharCount}/{MAX_DESCRIPTION_LENGTH} characters
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
