'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from 'lucide-react'
import { FINGERPRINT_PARAMS } from './config-variables'
import type { RuleConfig, FingerprintParameter } from '@/types/ruleTypes'

interface FingerprintTabProps {
  formData: RuleConfig
  setFormData: React.Dispatch<React.SetStateAction<RuleConfig>>
}

const ParameterInput: React.FC<{
  param: FingerprintParameter
  onRemove: () => void
  onChange: (newParam: FingerprintParameter) => void
}> = ({ param, onRemove, onChange }) => {
  const renderInput = () => {
    switch (param.name) {
      case 'headers.name':
        return (
          <Input
            value={param.headerName || ''}
            onChange={(e) => onChange({ ...param, headerName: e.target.value })}
            placeholder="Value of Header (Input header name)"
            className="flex-1 bg-gray-700 text-white border-gray-600"
          />
        )
      case 'headers.cookieNameValue':
        return (
          <>
          <Input
            value={param.cookieName || ''}
            onChange={(e) => onChange({ ...param, cookieName: e.target.value })}
            placeholder="Specific cookie name"
            className="flex-1 bg-gray-700 text-white border-gray-600"
          />
          <Input
            value={param.cookieValue || ''}
            onChange={(e) => onChange({ ...param, cookieValue: e.target.value })}
            placeholder="Specific cookie value"
            className="flex-1 bg-gray-700 text-white border-gray-600"
          />
          </>
        )     
      case 'headers.cookieName':
        return (
          <Input
            value={param.cookieName || ''}
            onChange={(e) => onChange({ ...param, cookieName: e.target.value })}
            placeholder="Use a specific cookie's value for fingerprinting (Input Cookie Key)"
            className="flex-1 bg-gray-700 text-white border-gray-600"
          />
        ) 
      case 'headers.nameValue':
        return (
          <>
            <Input
              value={param.headerName || ''}
              onChange={(e) => onChange({ ...param, headerName: e.target.value })}
              placeholder="Header Name"
              className="flex-1 bg-gray-700 text-white border-gray-600 mr-2"
            />
            <Input
              value={param.headerValue || ''}
              onChange={(e) => onChange({ ...param, headerValue: e.target.value })}
              placeholder="Header Value"
              className="flex-1 bg-gray-700 text-white border-gray-600"
            />
          </>
        )
      case 'body':
        return (
          <Textarea
            value={param.body || ''}
            onChange={(e) => onChange({ ...param, body: e.target.value })}
            placeholder="Enter full request body"
            className="flex-1 min-h-[100px] bg-gray-700 text-white border-gray-600"
          />
        )
      case 'body.field':
        return (
          <>
            <Input
              value={param.bodyFieldName || ''}
              onChange={(e) => onChange({ ...param, bodyFieldName: e.target.value })}
              placeholder="Body Field Name"
              className="flex-1 bg-gray-700 text-white border-gray-600 mr-2"
            />
            <Input
              value={param.bodyField || ''}
              onChange={(e) => onChange({ ...param, bodyField: e.target.value })}
              placeholder="Body Field Value"
              className="flex-1 bg-gray-700 text-white border-gray-600"
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded-md mb-2">
      <Label className="w-1/4 text-sm font-medium text-gray-300">
        {FINGERPRINT_PARAMS.find(p => p.value === param.name)?.label || param.name}
      </Label>
      <div className="flex-1 flex space-x-2">
        {renderInput()}
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} className="flex-shrink-0">
        <Trash2 className="h-4 w-4 text-gray-400" />
      </Button>
    </div>
  )
}

export function FingerprintTab({ formData, setFormData }: FingerprintTabProps) {
  const [selectedParam, setSelectedParam] = useState<string | null>(null)

  const handleParamChange = (idx: number, newParam: FingerprintParameter) => {
    setFormData((prev) => ({
      ...prev,
      fingerprint: {
        parameters: prev.fingerprint.parameters.map((p, i) =>
          i === idx ? newParam : p
        ),
      },
    }))
  }

  const handleRemoveParam = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      fingerprint: {
        parameters: prev.fingerprint.parameters.filter((_, i) => i !== idx),
      },
    }))
  }

  const handleAddParam = () => {
    if (selectedParam) {
      setFormData((prev) => ({
        ...prev,
        fingerprint: {
          parameters: [...prev.fingerprint.parameters, { name: selectedParam }],
        },
      }))
      setSelectedParam(null)
    }
  }

  return (
    <Card className="bg-gray-900 text-white border-gray-700">
      <CardHeader>
        <CardTitle>Fingerprint Configuration</CardTitle>
        <CardDescription className="text-gray-400">Select the parameters to use for identifying unique clients.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <TooltipProvider>
              <Select value={selectedParam || ''} onValueChange={setSelectedParam}>
                <SelectTrigger className="w-[300px] bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select a parameter to add" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {FINGERPRINT_PARAMS.map((param) => (
                    <Tooltip key={param.value}>
                      <TooltipTrigger asChild>
                        <SelectItem value={param.value} className="text-white hover:bg-gray-700">
                          {param.label}
                        </SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-gray-700 text-white border-gray-600">
                        <p>{param.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </SelectContent>
              </Select>
            </TooltipProvider>
            <Button onClick={handleAddParam} disabled={!selectedParam}>
              Add Parameter
            </Button>
          </div>
          <ScrollArea className="h-[400px] rounded-md border border-gray-700 p-4">
            {formData.fingerprint.parameters.map((param, idx) => (
              <ParameterInput
                key={`${param.name}-${idx}`}
                param={param}
                onChange={(newParam) => handleParamChange(idx, newParam)}
                onRemove={() => handleRemoveParam(idx)}
              />
            ))}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

export default FingerprintTab
