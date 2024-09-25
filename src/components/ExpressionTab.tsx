import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LABELS } from './config-variables'
import type { RuleConfig } from '@/types/ruleTypes'
import { Copy, Check } from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import type { PrismTheme } from 'prism-react-renderer'
import { useTheme } from 'next-themes'

interface ExpressionTabProps {
  formData: RuleConfig
}

export function ExpressionTab({ formData }: ExpressionTabProps) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const [currentTheme, setCurrentTheme] = useState<PrismTheme>(themes.github)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      setCurrentTheme(resolvedTheme === 'dark' ? themes.dracula: themes.nightOwlLight)
    }
  }, [resolvedTheme, mounted])

  const generateRuleExpression = (config: RuleConfig): string => {
    return JSON.stringify(config, null, 2)
  }

  const ruleExpression = useMemo(() => generateRuleExpression(formData), [formData])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ruleExpression).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {LABELS.REQUEST_MATCH}
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </CardTitle>
        <CardDescription>This is the JSON representation of your rule configuration.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md overflow-hidden">
          <Highlight theme={currentTheme} code={ruleExpression} language="json">
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre className={`${className} p-4 overflow-auto max-h-[400px] bg-muted`} style={{
                ...style,
                backgroundColor: 'transparent',
                color: resolvedTheme === 'dark' ? '#D4D4D4' : '#24292e'
              }}>
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line, key: i })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      </CardContent>
    </Card>
  )
}
