// ConditionRenderer.tsx
import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { PlusCircle, MinusCircle } from 'lucide-react'
import { LABELS, LOGICAL_OPERATORS, REQUEST_MATCH_FIELDS, REQUEST_MATCH_OPERATORS } from './config-variables'
import type { Condition, ConditionGroup } from '@/types/ruleTypes'

interface ConditionRendererProps {
  conditions: (Condition | ConditionGroup | { type: 'operator'; logic: string })[]
  setFormData: React.Dispatch<React.SetStateAction<any>>
  depth?: number
}

export function ConditionRenderer({ conditions, setFormData, depth = 0 }: ConditionRendererProps) {
  const addCondition = () => {
    const newCondition: Condition = { field: 'clientIP', operator: 'eq', value: '' }
    conditions.push(newCondition)
    if (conditions.length > 1) {
      conditions.splice(-1, 0, { type: 'operator', logic: 'and' })
    }
    setFormData((prev: any) => ({ ...prev }))
  }

  const addConditionGroup = () => {
    const newGroup: ConditionGroup = { conditions: [] }
    conditions.push(newGroup)
    if (conditions.length > 1) {
      conditions.splice(-1, 0, { type: 'operator', logic: 'and' })
    }
    setFormData((prev: any) => ({ ...prev }))
  }

  const removeCondition = (index: number) => {
    conditions.splice(index, 1)
    if (index > 0 && conditions[index - 1] && 'type' in conditions[index - 1] && (conditions[index - 1] as { type: string }).type === 'operator') {
      conditions.splice(index - 1, 1)
    }
    setFormData((prev: any) => ({ ...prev }))
  }

  return (
    <>
      {conditions.map((condition, index) => {
        if ('conditions' in condition) {
          return (
            <Card key={`group-${depth}-${index}`} className="mt-4 mb-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Condition Group</CardTitle>
                <Button
                  type="button"
                  onClick={() => removeCondition(index)}
                  variant="destructive"
                  size="sm"
                >
                  Remove Group
                </Button>
              </CardHeader>
              <CardContent>
                <ConditionRenderer conditions={condition.conditions} setFormData={setFormData} depth={depth + 1} />
                <div className="mt-4 space-x-2">
                  <Button type="button" onClick={addCondition} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Condition
                  </Button>
                  <Button type="button" onClick={addConditionGroup} size="sm">
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
                setFormData((prev: any) => ({ ...prev }))
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
                  setFormData((prev: any) => ({ ...prev }))
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
                  setFormData((prev: any) => ({ ...prev }))
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
                      setFormData((prev: any) => ({ ...prev }))
                    }}
                    placeholder="Header Name"
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    value={typedCondition.headerValue || ''}
                    onChange={(e) => {
                      typedCondition.headerValue = e.target.value
                      setFormData((prev: any) => ({ ...prev }))
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
                    setFormData((prev: any) => ({ ...prev }))
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
                    setFormData((prev: any) => ({ ...prev }))
                  }}
                  placeholder={LABELS.CONDITION_VALUE}
                  className="flex-1"
                />
              )}
              <Button type="button" onClick={() => removeCondition(index)} variant="destructive" size="icon">
                <MinusCircle className="h-4 w-4" />
              </Button>
            </div>
          )
        }
      })}
    </>
  )
}
