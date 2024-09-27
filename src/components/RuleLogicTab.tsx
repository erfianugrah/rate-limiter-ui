"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PlusCircle, MinusCircle } from 'lucide-react'
import { ACTION_TYPES, LABELS, LOGICAL_OPERATORS, REQUEST_MATCH_FIELDS, REQUEST_MATCH_OPERATORS } from './config-variables'
import type { RuleConfig, Condition, ConditionGroup, ConditionalAction } from '@/types/ruleTypes'

interface RuleLogicTabProps {
  formData: RuleConfig
  setFormData: React.Dispatch<React.SetStateAction<RuleConfig>>
}

export default function RuleLogicTab({ formData, setFormData }: RuleLogicTabProps) {
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

  const createActionObject = (type: string): ConditionalAction['action'] => {
    switch (type) {
      case 'customResponse':
        return { type, statusCode: 200, bodyType: 'text', body: '' }
      case 'rateLimit':
      case 'block':
      case 'allow':
      default:
        return { type }
    }
  }

  const renderActionFields = (action: ConditionalAction['action'], updateAction: (newAction: ConditionalAction['action']) => void) => {
    if (action.type === 'customResponse') {
      return (
        <div className="space-y-4">
          <div>
            <Label>HTTP Status Code</Label>
            <Input
              type="number"
              value={action.statusCode || ''}
              onChange={(e) => updateAction({ ...action, statusCode: parseInt(e.target.value) })}
              placeholder="Enter HTTP status code"
            />
          </div>
          <div>
            <Label>Response Body Type</Label>
            <Select
              value={action.bodyType || 'text'}
              onValueChange={(value: 'text' | 'json' | 'html') => updateAction({ ...action, bodyType: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select body type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Response Body</Label>
            <Input
              type="text"
              value={action.body || ''}
              onChange={(e) => updateAction({ ...action, body: e.target.value })}
              placeholder={`Enter ${action.bodyType || 'text'} response body`}
            />
          </div>
        </div>
      )
    }
    return null
  }

  const addElseIfAction = () => {
    setFormData((prev) => ({
      ...prev,
      elseIfActions: [
        ...prev.elseIfActions,
        {
          conditions: [],
          action: createActionObject('block'),
        },
      ],
    }))
  }

  const removeElse = () => {
    setFormData((prev) => {
      const { elseAction, ...rest } = prev
      return rest
    })
  }

  const removeElseIfAction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      elseIfActions: prev.elseIfActions.filter((_, i) => i !== index),
    }))
  }

  const addElse = () => {
    setFormData((prev) => ({
      ...prev,
      elseAction: createActionObject('allow'),
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rule Logic Configuration</CardTitle>
        <CardDescription>Configure the request match and conditional actions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ScrollArea className="h-[400px] rounded-md border p-4">
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
                          initialMatch: { 
                            ...prev.initialMatch, 
                            action: createActionObject(value)
                          },
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
                    {renderActionFields(formData.initialMatch.action, (newAction) => {
                      setFormData((prev) => ({
                        ...prev,
                        initialMatch: { ...prev.initialMatch, action: newAction },
                      }))
                    })}
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
                          updatedElseIfActions[index].action = createActionObject(value)
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
                      {renderActionFields(elseIfAction.action, (newAction) => {
                        const updatedElseIfActions = [...formData.elseIfActions]
                        updatedElseIfActions[index].action = newAction
                        setFormData((prev) => ({ ...prev, elseIfActions: updatedElseIfActions }))
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {formData.elseAction && (
              <Card className="mt-4">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold">Else Action</CardTitle>
                    <Button onClick={removeElse} variant="destructive" size="sm">
                      Remove Else
                    </Button>
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
                          elseAction: createActionObject(value),
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
                    {renderActionFields(formData.elseAction, (newAction) => {
                      setFormData((prev) => ({ ...prev, elseAction: newAction }))
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {!formData.elseAction && (
              <div className="mt-4">
                <Button onClick={addElse} size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Else Action
                </Button>
              </div>
            )}

            {formData.elseAction && (
              <div className="mt-4">
                <Button onClick={addElseIfAction} size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Else If Condition
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
