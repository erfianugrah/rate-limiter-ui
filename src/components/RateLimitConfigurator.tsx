'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PlusCircle, MinusCircle, Info } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LABELS,
  LOGICAL_OPERATORS,
  ACTION_TYPES,
  FINGERPRINT_PARAMS,
  REQUEST_MATCH_FIELDS,
  REQUEST_MATCH_OPERATORS,
} from './config-variables'

interface Condition {
  field: string
  operator: string
  value: string
  headerName?: string
  headerValue?: string
}

interface ConditionGroup {
  conditions: (Condition | ConditionGroup | { type: 'operator'; logic: string })[]
}

interface FingerprintParameter {
  name: string
  headerName?: string
  headerValue?: string
  body?: string
}

interface ConditionalAction {
  conditions: (Condition | ConditionGroup | { type: 'operator'; logic: string })[]
  action: {
    type: string
  }
}

interface RuleConfig {
  id: string
  order: number
  name: string
  description: string
  rateLimit: {
    limit: number
    period: number
  }
  fingerprint: {
    parameters: FingerprintParameter[]
  }
  initialMatch: ConditionalAction
  elseAction: {
    type: string
  }
  elseIfActions: ConditionalAction[]
}

const defaultFormData: RuleConfig = {
  id: uuidv4(),
  order: 0,
  name: '',
  description: '',
  rateLimit: {
    limit: 0,
    period: 0,
  },
  fingerprint: {
    parameters: [],
  },
  initialMatch: {
    conditions: [],
    action: { type: 'rateLimit' },
  },
  elseAction: {
    type: 'allow',
  },
  elseIfActions: [],
}

interface RateLimitConfiguratorProps {
  initialData?: RuleConfig
  onSave: (config: RuleConfig) => void
  onCancel: () => void
}

export default function RateLimitConfigurator({ initialData, onSave, onCancel }: RateLimitConfiguratorProps) {
  const [formData, setFormData] = useState<RuleConfig>(() => {
    if (initialData) {
      return {
        ...defaultFormData,
        ...initialData,
        initialMatch: initialData.initialMatch || defaultFormData.initialMatch,
        elseAction: initialData.elseAction || defaultFormData.elseAction,
        elseIfActions: initialData.elseIfActions || defaultFormData.elseIfActions,
      }
    }
    return defaultFormData
  })

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        initialMatch: initialData.initialMatch || prev.initialMatch,
        elseAction: initialData.elseAction || prev.elseAction,
        elseIfActions: initialData.elseIfActions || prev.elseIfActions,
      }))
    }
  }, [initialData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRateLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      rateLimit: { ...prev.rateLimit, [name]: parseInt(value) || 0 },
    }))
  }

  const addCondition = (parentConditions: (Condition | ConditionGroup | { type: 'operator'; logic: string })[]) => {
    const newCondition: Condition = { field: 'clientIP', operator: 'eq', value: '' }
    parentConditions.push(newCondition)
    if (parentConditions.length > 1) {
      parentConditions.splice(-1, 0, { type: 'operator', logic: 'and' })
    }
    setFormData({ ...formData })
  }

  const addConditionGroup = (parentConditions: (Condition | ConditionGroup | { type: 'operator'; logic: string })[]) => {
    const newGroup: ConditionGroup = { conditions: [] }
    parentConditions.push(newGroup)
    if (parentConditions.length > 1) {
      parentConditions.splice(-1, 0, { type: 'operator', logic: 'and' })
    }
    setFormData({ ...formData })
  }

  const removeCondition = (parentConditions: (Condition | ConditionGroup | { type: 'operator'; logic: string })[], index: number) => {
    parentConditions.splice(index, 1)
    if (index > 0 && parentConditions[index - 1] && 'type' in parentConditions[index - 1] && (parentConditions[index - 1] as { type: string }).type === 'operator') {
      parentConditions.splice(index - 1, 1)
    }
    setFormData({ ...formData })
  }

  const renderConditions = (conditions: (Condition | ConditionGroup | { type: 'operator'; logic: string })[], depth = 0) => {
    return conditions.map((condition, index) => {
      if ('conditions' in condition) {
        return (
          <Card key={`group-${depth}-${index}`} className="mt-4 mb-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Condition Group</CardTitle>
              <Button
                type="button"
                onClick={() => removeCondition(conditions, index)}
                variant="destructive"
                size="sm"
              >
                Remove Group
              </Button>
            </CardHeader>
            <CardContent>
              {renderConditions(condition.conditions, depth + 1)}
              <div className="mt-4 space-x-2">
                <Button type="button" onClick={() => addCondition(condition.conditions)} size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Condition
                </Button>
                <Button type="button" onClick={() => addConditionGroup(condition.conditions)} size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Group
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      } else if ('type' in condition && condition.type === 'operator') {
        return (
          <Select
            key={`operator-${depth}-${index}`}
            value={condition.logic}
            onValueChange={(value) => {
              condition.logic = value
              setFormData({ ...formData })
            }}
          >
            <SelectTrigger className="w-[100px] my-2">
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              {LOGICAL_OPERATORS.map((op, idx) => (
                <SelectItem key={`logic-${op.value}-${index}-${idx}`} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      } else {
        const typedCondition = condition as Condition
        return (
          <div key={`condition-${depth}-${index}`} className="flex items-center gap-2 my-2">
            <Select
              value={typedCondition.field}
              onValueChange={(value) => {
                typedCondition.field = value
                setFormData({ ...formData })
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={LABELS.CONDITION_FIELD} />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_MATCH_FIELDS.map((field, idx) => (
                  <SelectItem key={`field-${field.value}-${index}-${idx}`} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={typedCondition.operator}
              onValueChange={(value) => {
                typedCondition.operator = value
                setFormData({ ...formData })
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={LABELS.CONDITION_OPERATOR} />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_MATCH_OPERATORS.map((op, idx) => (
                  <SelectItem key={`operator-${op.value}-${index}-${idx}`} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {typedCondition.field === 'headers.nameValue' ? (
              <>
                <Input
                  type="text"
                  value={typedCondition.headerName || ''}
                  onChange={(e) => {
                    typedCondition.headerName = e.target.value
                    setFormData({ ...formData })
                  }}
                  placeholder="Header Name"
                  className="flex-1"
                />
                <Input
                  type="text"
                  value={typedCondition.headerValue || ''}
                  onChange={(e) => {
                    typedCondition.headerValue = e.target.value
                    setFormData({ ...formData })
                  }}
                  placeholder="Header Value"
                  className="flex-1"
                />
              </>
            ) : typedCondition.field === 'headers.name' ? (
              <Input
                type="text"
                value={typedCondition.headerName || ''}
                onChange={(e) => {
                  typedCondition.headerName = e.target.value
                  setFormData({ ...formData })
                }}
                placeholder="Header Name"
                className="flex-1"
              />
            ) : (
              <Input
                type="text"
                value={typedCondition.value}
                onChange={(e) => {
                  typedCondition.value = e.target.value
                  setFormData({ ...formData })
                }}
                placeholder={LABELS.CONDITION_VALUE}
                className="flex-1"
              />
            )}
            <Button type="button" onClick={() => removeCondition(conditions, index)} variant="destructive" size="icon">
              <MinusCircle className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    })
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

  const addElseIfAction = () => {
    setFormData((prev) => ({
      ...prev,
      elseIfActions: [
        ...prev.elseIfActions,
        {
          conditions: [],
          action: { type: 'block' },
        },
      ],
    }))
  }

  const removeElseIfAction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      elseIfActions: prev.elseIfActions.filter((_: ConditionalAction, i: number) => i !== index),
    }))
  }

  const renderConditionalActions =  () => {
    return (
      <>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Initial Request Match (If)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Conditions</Label>
                {renderConditions(formData.initialMatch.conditions)}
                <div className="mt-2 space-x-2">
                  <Button type="button" onClick={() => addCondition(formData.initialMatch.conditions)} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Condition
                  </Button>
                  <Button type="button" onClick={() => addConditionGroup(formData.initialMatch.conditions)} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Group
                  </Button>
                </div>
              </div>
              <div>
                <Label>Action</Label>
                <Select
                  value={formData.initialMatch.action.type}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      initialMatch: { ...prev.initialMatch, action: { type: value } },
                    }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((action, idx) => (
                      <SelectItem key={`action-${action.value}-${idx}`} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {formData.elseIfActions.map((elseIfAction, index) => (
          <Card key={`else-if-${index}`} className="mt-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">Else If Condition {index + 1}</CardTitle>
                <Button onClick={() => removeElseIfAction(index)} variant="destructive" size="sm">
                  Remove
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Conditions</Label>
                  {renderConditions(elseIfAction.conditions)}
                  <div className="mt-2 space-x-2">
                    <Button type="button" onClick={() => addCondition(elseIfAction.conditions)} size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Condition
                    </Button>
                    <Button type="button" onClick={() => addConditionGroup(elseIfAction.conditions)} size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Group
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Action</Label>
                  <Select
                    value={elseIfAction.action.type}
                    onValueChange={(value) => {
                      const updatedElseIfActions = [...formData.elseIfActions]
                      updatedElseIfActions[index].action.type = value
                      setFormData((prev) => ({ ...prev, elseIfActions: updatedElseIfActions }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select action type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((action, idx) => (
                        <SelectItem key={`action-${action.value}-${idx}`} value={action.value}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="mt-4">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Else Action</CardTitle>
              {formData.elseAction.type && (
                <Button 
                  onClick={() => setFormData(prev => ({ ...prev, elseAction: { type: '' } }))} 
                  variant="destructive" 
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Action</Label>
              <Select
                value={formData.elseAction.type}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    elseAction: { type: value },
                  }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((action, idx) => (
                    <SelectItem key={`action-${action.value}-${idx}`} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

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

  const generateRuleExpression = (config: RuleConfig): string => {
    return JSON.stringify(config, null, 2)
  }

  const ruleExpression = useMemo(() => generateRuleExpression(formData), [formData])

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full w-full max-w-7xl mx-auto">
        <Tabs defaultValue="basic" className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="rateLimit">Rate Limit</TabsTrigger>
            <TabsTrigger value="fingerprint">Fingerprint</TabsTrigger>
            <TabsTrigger value="conditionalActions">Conditional Actions</TabsTrigger>
            <TabsTrigger value="expression">Rule Expression</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-grow">
            <div className="p-6 space-y-8">
              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Provide general information about the rule.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{LABELS.RULE_NAME}</Label>
                      <Input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">{LABELS.DESCRIPTION}</Label>
                      <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rateLimit">
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
              </TabsContent>

              <TabsContent value="fingerprint">
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
              </TabsContent>

              <TabsContent value="conditionalActions">
                <Card>
                  <CardHeader>
                    <CardTitle>Conditional Actions Configuration</CardTitle>
                    <CardDescription>Configure the request match and conditional actions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <ScrollArea className="h-[400px] rounded-md border p-4">
                        {renderConditionalActions()}
                      </ScrollArea>
                      <Button type="button" onClick={addElseIfAction} size="sm" className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Else If Condition
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expression">
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
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
        <div className="flex justify-end space-x-4 p-4 bg-background border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={(e) => { e.preventDefault(); onSave(formData); }}>
            Save Configuration
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
