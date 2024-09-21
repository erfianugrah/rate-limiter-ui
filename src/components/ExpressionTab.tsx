// ExpressionTab.tsx
import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { RuleConfig } from '@/types/ruleTypes'

interface ExpressionTabProps {
  formData: RuleConfig
}

export function ExpressionTab({ formData }: ExpressionTabProps) {
  const generateRuleExpression = (config: RuleConfig): string => {
    return JSON.stringify(config, null, 2)
  }

  const ruleExpression = useMemo(() => generateRuleExpression(formData), [formData])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Rule Expression</CardTitle>
        <CardDescription>This is the JSON representation of your rule configuration.</CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
          {ruleExpression}
        </pre>
      </CardContent>
    </Card>
  )
}
