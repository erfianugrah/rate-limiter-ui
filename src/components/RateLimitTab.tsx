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
  const handleRateLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      rateLimit: { ...prev.rateLimit, [name]: parseInt(value) || 0 },
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Limit Configuration</CardTitle>
        <CardDescription>Set the number of requests allowed within a specific time period.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="limit">{LABELS.REQUEST_LIMIT}</Label>
          <Input type="number" id="limit" name="limit" value={formData.rateLimit.limit} onChange={handleRateLimitChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="period">{LABELS.TIME_PERIOD}</Label>
          <Input type="number" id="period" name="period" value={formData.rateLimit.period} onChange={handleRateLimitChange} />
        </div>
      </CardContent>
    </Card>
  )
}

export default RateLimitTab
