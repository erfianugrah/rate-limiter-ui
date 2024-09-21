// FingerprintTab.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Info } from 'lucide-react'
import { FINGERPRINT_PARAMS } from './config-variables'
import type { RuleConfig, FingerprintParameter } from '@/types/ruleTypes'

interface FingerprintTabProps {
  formData: RuleConfig
  setFormData: React.Dispatch<React.SetStateAction<RuleConfig>>
}

export function FingerprintTab({ formData, setFormData }: FingerprintTabProps) {
  const handleFingerprintChange = (checked: boolean, paramValue: string) => {
    setFormData((prev) => ({
      ...prev,
      fingerprint: {
        parameters: checked
          ? [...prev.fingerprint.parameters, { name: paramValue }]
          : prev.fingerprint.parameters.filter((p) => p.name !== paramValue),
      },
    }))
  }

  const renderFingerprintInputs = () => {
    return formData.fingerprint.parameters.map((param, idx) => {
      if (param.name === 'headers.nameValue') {
        return (
          <div key={`fingerprint-${param.name}-${idx}`} className="mt-4 border p-4 rounded-md">
            <Label className="mb-2">Header Name and Value Pair</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="text"
                value={param.headerName || ''}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    fingerprint: {
                      parameters: prev.fingerprint.parameters.map((p, i) =>
                        i === idx ? { ...p, headerName: e.target.value } : p
                      ),
                    },
                  }))
                }}
                placeholder="Header Name"
                className="flex-1"
              />
              <Input
                type="text"
                value={param.headerValue || ''}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    fingerprint: {
                      parameters: prev.fingerprint.parameters.map((p, i) =>
                        i === idx ? { ...p, headerValue: e.target.value } : p
                      ),
                    },
                  }))
                }}
                placeholder="Header Value"
                className="flex-1"
              />
            </div>
          </div>
        )
      } else if (param.name === 'headers.name') {
        return (
          <div key={`fingerprint-${param.name}-${idx}`} className="mt-4 border p-4 rounded-md">
            <Label className="mb-2">Specific Header Value</Label>
            <Input
              type="text"
              value={param.headerName || ''}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  fingerprint: {
                    parameters: prev.fingerprint.parameters.map((p, i) =>
                      i === idx ? { ...p, headerName: e.target.value } : p
                    ),
                  },
                }))
              }}
              placeholder="Header Name"
              className="w-full mt-2"
            />
          </div>
        )
      } else if (param.name === 'body') {
        return (
          <div key={`fingerprint-${param.name}-${idx}`} className="mt-4 border p-4 rounded-md">
            <Label className="mb-2">Full Request Body</Label>
            <Textarea
              value={param.body || ''}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  fingerprint: {
                    parameters: prev.fingerprint.parameters.map((p, i) =>
                      i === idx ? { ...p, body: e.target.value } : p
                    ),
                  },
                }))
              }}
              placeholder="Request Body"
              className="w-full mt-2"
            />
          </div>
        )
      }
      return null
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fingerprint Configuration</CardTitle>
        <CardDescription>Select the parameters to use for identifying unique clients.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-4">
                {FINGERPRINT_PARAMS.map((param) => (
                  <div key={param.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`fingerprint-${param.value}`}
                      checked={formData.fingerprint.parameters.some((p) => p.name === param.value)}
                      onCheckedChange={(checked) => handleFingerprintChange(checked as boolean, param.value)}
                    />
                    <Label htmlFor={`fingerprint-${param.value}`} className="flex-1">{param.label}</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{param.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="w-full md:w-1/2">
            <ScrollArea className="h-[400px] rounded-md border p-4">
              {renderFingerprintInputs()}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default FingerprintTab
