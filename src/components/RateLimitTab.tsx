// RateLimitTab.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LABELS } from './config-variables'
import type { RuleConfig } from '@/types/ruleTypes'

interface RateLimitTabProps {
  formData: RuleConfig
  setFormData: React.Dispatch<React.SetStateAction<RuleConfig>>
}

export function RateLimitTab({ formData, setFormData }: RateLimitTabProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      rateLimit: {
        ...prev.rateLimit,
        [name]: parseInt(value, 10) || 0,
      },
    }))
  }

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Rate Limit Settings</CardTitle>
        <CardDescription className="text-foreground-secondary">Configure the rate limit parameters for this rule.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="limit" className="text-foreground">{LABELS.REQUEST_LIMIT}</Label>
          <Input
            type="number"
            id="limit"
            name="limit"
            value={formData.rateLimit.limit}
            onChange={handleInputChange}
            min={0}
            placeholder="Enter request limit"
            className="border-input focus:border-input-focus focus:ring-ring-focus"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="period" className="text-foreground">{LABELS.TIME_PERIOD}</Label>
          <Input
            type="number"
            id="period"
            name="period"
            value={formData.rateLimit.period}
            onChange={handleInputChange}
            min={0}
            placeholder="Enter time period (in seconds)"
            className="border-input focus:border-input-focus focus:ring-ring-focus"
          />
        </div>
      </CardContent>
    </Card>
  )
}
