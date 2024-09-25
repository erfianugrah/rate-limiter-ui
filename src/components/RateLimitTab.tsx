import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    setFormData(prevData => ({
      ...prevData,
      rateLimit: {
        ...prevData.rateLimit,
        [name]: value === '' ? '' : parseInt(value, 10) || 0
      }
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{LABELS.REQUEST_LIMIT}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="limit">{LABELS.REQUEST_LIMIT}</Label>
          <Input
            id="limit"
            name="limit"
            type="number"
            value={formData.rateLimit.limit}
            onChange={handleInputChange}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="period">{LABELS.TIME_PERIOD}</Label>
          <Input
            id="period"
            name="period"
            type="number"
            value={formData.rateLimit.period}
            onChange={handleInputChange}
            min="0"
          />
        </div>
      </CardContent>
    </Card>
  )
}
