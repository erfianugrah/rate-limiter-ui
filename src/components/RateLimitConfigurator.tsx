'use client'

import React, { useState } from 'react'
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

export default function Component() {
  const [formData, setFormData] = useState({
    id: uuidv4(),
    order: 1,
    name: '',
    description: '',
    rateLimit: {
      limit: 0,
      period: 0,
    },
    requestMatch: {
      conditions: [],
    },
    action: {
      type: 'rateLimit',
    },
    fingerprint: {
      parameters: [],
    },
    conditionalActions: [],
  })

  const [generatedObject, setGeneratedObject] = useState('')
  const [message, setMessage] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRateLimitChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      rateLimit: { ...prev.rateLimit, [name]: parseInt(value) },
    }))
  }

  const addCondition = (parentConditions) => {
    const newCondition = { field: 'clientIP', operator: 'eq', value: '' }
    parentConditions.push(newCondition)
    if (parentConditions.length > 1) {
      parentConditions.splice(-1, 0, { type: 'operator', logic: 'and' })
    }
    setFormData({ ...formData })
  }

  const addConditionGroup = (parentConditions) => {
    const newGroup = { conditions: [] }
    parentConditions.push(newGroup)
    if (parentConditions.length > 1) {
      parentConditions.splice(-1, 0, { type: 'operator', logic: 'and' })
    }
    setFormData({ ...formData })
  }

  const removeCondition = (parentConditions, index) => {
    parentConditions.splice(index, 1)
    if (index > 0 && parentConditions[index - 1]?.type === 'operator') {
      parentConditions.splice(index - 1, 1)
    }
    setFormData({ ...formData })
  }

  const renderConditions = (conditions, depth = 0) => {
    return conditions.map((condition, index) => {
      if (condition?.conditions) {
        return (
          <Card key={`group-${depth}-${index}`} className="mt-2 mb-2">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-left">Condition Group</CardTitle>
              <Button
                type="button"
                onClick={() => removeCondition(conditions, index)}
                variant="destructive"
                className="ml-auto"
              >
                Remove Group
              </Button>
            </CardHeader>
            <CardContent>
              {renderConditions(condition.conditions, depth + 1)}
              <div className="mt-2">
                <Button type="button" onClick={() => addCondition(condition.conditions)} className="mr-2">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Condition
                </Button>
                <Button type="button" onClick={() => addConditionGroup(condition.conditions)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Group
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      } else if (condition?.type === 'operator') {
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
        return (
          <div key={`condition-${depth}-${index}`} className="flex items-center space-x-2 my-2">
            <Select
              value={condition.field}
              onValueChange={(value) => {
                condition.field = value
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
              value={condition.operator}
              onValueChange={(value) => {
                condition.operator = value
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
            {condition.field === 'headers.nameValue' ? (
              <>
                <Input
                  type="text"
                  value={condition.headerName || ''}
                  onChange={(e) => {
                    condition.headerName = e.target.value
                    setFormData({ ...formData })
                  }}
                  placeholder="Header Name"
                  className="w-[150px]"
                />
                <Input
                  type="text"
                  value={condition.headerValue || ''}
                  onChange={(e) => {
                    condition.headerValue = e.target.value
                    setFormData({ ...formData })
                  }}
                  placeholder="Header Value"
                  className="w-[150px]"
                />
              </>
            ) : condition.field === 'headers.name' ? (
              <Input
                type="text"
                value={condition.headerName || ''}
                onChange={(e) => {
                  condition.headerName = e.target.value
                  setFormData({ ...formData })
                }}
                placeholder="Header Name"
                className="w-[300px]"
              />
            ) : (
              <Input
                type="text"
                value={condition.value}
                onChange={(e) => {
                  condition.value = e.target.value
                  setFormData({ ...formData })
                }}
                placeholder={LABELS.CONDITION_VALUE}
                className="w-[300px]"
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
              className="w-[150px]"
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
              className="w-[150px] mt-2"
            />
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
              className="w-[300px]"
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
              className="w-[300px] mt-2"
            />
          </div>
        )
      }
      return null
    })
  }

  const addConditionalAction = () => {
    setFormData((prev) => ({
      ...prev,
      conditionalActions: [
        ...prev.conditionalActions,
        {
          conditions: [],
          action: { type: 'block' },
        },
      ],
    }))
  }

  const removeConditionalAction = (index) => {
    setFormData((prev) => ({
      ...prev,
      conditionalActions: prev.conditionalActions.filter((_, i) => i !== index),
    }))
  }

const renderConditionalActions = () => {
  return formData.conditionalActions.map((conditionalAction, index) => (
    <Card key={`conditional-action-${index}`} className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Conditional Action {index + 1}</CardTitle>
          <Button onClick={() => removeConditionalAction(index)} variant="destructive" size="sm">
            Remove
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Conditions</Label>
            {renderConditions(conditionalAction.conditions)}
            <div className="mt-2">
              <Button type="button" onClick={() => addCondition(conditionalAction.conditions)} className="mr-2">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Condition
              </Button>
              <Button type="button" onClick={() => addConditionGroup(conditionalAction.conditions)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Group
              </Button>
            </div>
          </div>
          <div>
            <Label>Action</Label>
            <Select
              value={conditionalAction.action.type}
              onValueChange={(value) => {
                const updatedActions = [...formData.conditionalActions]
                updatedActions[index].action.type = value
                setFormData((prev) => ({ ...prev, conditionalActions: updatedActions }))
              }}
            >
              <SelectTrigger className="w-[180px]">
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
  ))
}

  const generateObject = () => {
    setGeneratedObject(JSON.stringify(formData, null, 2))
  }

  const saveConfig = async () => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage('Config saved successfully!')
      } else {
        setMessage('Failed to save config')
      }
    } catch (error) {
      setMessage('An error occurred: ' + error.message)
    }
  }

  const handleFingerprintChange = (checked, paramValue) => {
    setFormData((prev) => ({
      ...prev,
      fingerprint: {
        parameters: checked
          ? [...prev.fingerprint.parameters, { name: paramValue }]
          : prev.fingerprint.parameters.filter((p) => p.name !== paramValue),
      },
    }))
  }

  return (
    <TooltipProvider>
      <form className="space-y-8 w-full max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting Rule Configuration</CardTitle>
            <CardDescription>
              Configure your rate limiting rule by following these steps. Each section builds upon the previous one to create a comprehensive rule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="rateLimit">Rate Limit</TabsTrigger>
                <TabsTrigger value="fingerprint">Fingerprint</TabsTrigger>
                <TabsTrigger value="requestMatch">Request Match</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Provide general information about the rule.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="order">{LABELS.ORDER}</Label>
                      <Input type="number" id="order" name="order" value={formData.order} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="name">{LABELS.RULE_NAME}</Label>
                      <Input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div>
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
                    <div>
                      <Label htmlFor="limit">{LABELS.REQUEST_LIMIT}</Label>
                      <Input type="number" id="limit" name="limit" value={formData.rateLimit.limit} onChange={handleRateLimitChange} />
                    </div>
                    <div>
                      <Label htmlFor="period">{LABELS.TIME_PERIOD}</Label>
                      <Input type="number" id="period" name="period" value={formData.rateLimit.period} onChange={handleRateLimitChange} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fingerprint">
                <Card>
                  <CardHeader>
                    <CardTitle>{LABELS.FINGERPRINT_PARAMS}</CardTitle>
                    <CardDescription>Select the parameters to use for identifying unique requests.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px] w-full border rounded-md">
                      {FINGERPRINT_PARAMS.map((param, index) => (
                        <div key={`fingerprint-${param.value}-${index}`} className="flex items-center space-x-2 p-2">
                          <Checkbox
                            id={`fingerprint-${param.value}-${index}`}
                            checked={formData.fingerprint.parameters.some((p) => p.name === param.value)}
                            onCheckedChange={(checked) => handleFingerprintChange(checked, param.value)}
                          />
                          <Label htmlFor={`fingerprint-${param.value}-${index}`}>{param.label}</Label>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{param.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                    </ScrollArea>
                    {renderFingerprintInputs()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requestMatch">
                <Card>
                  <CardHeader>
                    <CardTitle>{LABELS.REQUEST_MATCH}</CardTitle>
                    <CardDescription>Define conditions to match requests for rate limiting.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderConditions(formData.requestMatch.conditions)}
                    <div className="mt-4">
                      <Button type="button" onClick={() => addCondition(formData.requestMatch.conditions)} className="mr-2">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Condition
                      </Button>
                      <Button type="button" onClick={() => addConditionGroup(formData.requestMatch.conditions)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Group
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions">
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Configure the default action and conditional actions to take when the rate limit is reached.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Default Action</Label>
                      <Select
                        value={formData.action.type}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, action: { type: value } }))}
                      >
                        <SelectTrigger className="w-[180px]">
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
                    <div>
                      <Label>Conditional Actions</Label>
                      <CardDescription className="mb-4">
                        Define additional actions to take based on specific conditions when the rate limit is reached.
                      </CardDescription>
                      {renderConditionalActions()}
                      <Button type="button" onClick={addConditionalAction} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Conditional Action
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex space-x-2">
          <Button type="button" onClick={generateObject}>
            Generate Object
          </Button>
          <Button type="button" onClick={saveConfig}>
            Save Config
          </Button>
        </div>

        {generatedObject && (
          <Card>
            <CardHeader>
              <CardTitle>Rule Expression</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                <code>{generatedObject}</code>
              </pre>
            </CardContent>
          </Card>
        )}

        {message && <p className="text-green-600">{message}</p>}
      </form>
    </TooltipProvider>
  )
}
