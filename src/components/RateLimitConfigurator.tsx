import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle, MinusCircle, Info } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  LABELS,
  LOGICAL_OPERATORS,
  ACTION_TYPES,
  FINGERPRINT_PARAMS,
  REQUEST_MATCH_FIELDS,
  REQUEST_MATCH_OPERATORS,
} from './config-variables';

type Condition = {
  field: string;
  operator: string;
  value: string;
};

type OperatorCondition = {
  type: 'operator';
  logic: 'and' | 'or';
};

type ConditionGroup = {
  conditions: (Condition | OperatorCondition | ConditionGroup)[];
};

type FormData = {
  id: string;
  order: number;
  name: string;
  description: string;
  rateLimit: {
    limit: number;
    period: number;
  };
  requestMatch: {
    conditions: (Condition | OperatorCondition | ConditionGroup)[];
  };
  action: {
    type: string;
  };
  fingerprint: {
    parameters: string[];
  };
};

// Type guards to distinguish between different condition types
const isCondition = (condition: Condition | OperatorCondition | ConditionGroup): condition is Condition => {
  return 'field' in condition && 'operator' in condition && 'value' in condition;
};

const isOperatorCondition = (condition: Condition | OperatorCondition | ConditionGroup): condition is OperatorCondition => {
  return 'type' in condition && condition.type === 'operator';
};

const isConditionGroup = (condition: Condition | OperatorCondition | ConditionGroup): condition is ConditionGroup => {
  return 'conditions' in condition;
};

export default function RateLimitConfigurator() {
  const [formData, setFormData] = useState<FormData>({
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
      parameters: ['clientIP'],
    },
  });

  const [generatedObject, setGeneratedObject] = useState('');
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRateLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      rateLimit: { ...prev.rateLimit, [name]: parseInt(value) },
    }));
  };

  const addCondition = (parentConditions: (Condition | OperatorCondition | ConditionGroup)[]) => {
    const newCondition: Condition = { field: 'clientIP', operator: 'eq', value: '' };
    parentConditions.push(newCondition);
    if (parentConditions.length > 1) {
      parentConditions.splice(-1, 0, { type: 'operator', logic: 'and' });
    }
    setFormData({ ...formData });
  };

  const addConditionGroup = (parentConditions: (Condition | OperatorCondition | ConditionGroup)[]) => {
    const newGroup: ConditionGroup = { conditions: [] };
    parentConditions.push(newGroup);
    if (parentConditions.length > 1) {
      parentConditions.splice(-1, 0, { type: 'operator', logic: 'and' });
    }
    setFormData({ ...formData });
  };

  const removeCondition = (parentConditions: (Condition | OperatorCondition | ConditionGroup)[], index: number) => {
    parentConditions.splice(index, 1);
    // Remove the operator if it's right before the removed condition or group
    if (index > 0 && isOperatorCondition(parentConditions[index - 1])) {
      parentConditions.splice(index - 1, 1);
    }
    setFormData({ ...formData });
  };

  const renderConditions = (conditions: (Condition | OperatorCondition | ConditionGroup)[], depth = 0) => {
    return conditions.map((condition, index) => {
      if (isConditionGroup(condition)) {
        return (
          <Card key={index} className="mt-2 mb-2">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-left">Condition Group</CardTitle>
              <Button
                type="button"
                onClick={() => removeCondition(conditions, index)}
                variant="destructive"
                className="ml-auto"
              >
                <MinusCircle className="h-4 w-4" />
                Remove Group
              </Button>
            </CardHeader>
            <CardContent>
              {renderConditions(condition.conditions, depth + 1)}
              <Button type="button" onClick={() => addCondition(condition.conditions)} className="mr-2 mt-2">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Condition
              </Button>
              <Button type="button" onClick={() => addConditionGroup(condition.conditions)} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Group
              </Button>
            </CardContent>
          </Card>
        );
      } else if (isOperatorCondition(condition)) {
        return (
          <Select key={index} value={condition.logic} onValueChange={(value) => {
            condition.logic = value as 'and' | 'or';
            setFormData({ ...formData });
          }}>
            <SelectTrigger className="w-[180px] my-2">
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {LOGICAL_OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      } else if (isCondition(condition)) {
        return (
          <div key={index} className="flex items-center space-x-2 my-2">
            <Select value={condition.field} onValueChange={(value) => {
              condition.field = value;
              setFormData({ ...formData });
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={LABELS.CONDITION_FIELD} />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_MATCH_FIELDS.map((field) => (
                  <SelectItem key={`request-${field.value}`} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={condition.operator} onValueChange={(value) => {
              condition.operator = value;
              setFormData({ ...formData });
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={LABELS.CONDITION_OPERATOR} />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_MATCH_OPERATORS.map((op) => (
                  <SelectItem key={`operator-${op.value}`} value={op.value}>{op.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="text"
              value={condition.value}
              onChange={(e) => {
                condition.value = e.target.value;
                setFormData({ ...formData });
              }}
              placeholder={LABELS.CONDITION_VALUE}
            />
            <Button type="button" onClick={() => removeCondition(conditions, index)} variant="destructive">
              <MinusCircle className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    });
  };

  const generateObject = () => {
    setGeneratedObject(JSON.stringify(formData, null, 2));
  };

  const saveConfig = async () => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),  // Send formData to the backend
      });

      if (response.ok) {
        setMessage('Config saved successfully!');
      } else {
        setMessage('Failed to save config');
      }
    } catch (error: any) {
      setMessage('An error occurred: ' + error.message);
    }
  };

  return (
    <TooltipProvider>
      <form className="space-y-8 w-full max-w-2xl mx-auto p-4">
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

        <Card>
          <CardHeader>
            <CardTitle>Rate Limit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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

        <Card>
          <CardHeader>
            <CardTitle>{LABELS.REQUEST_MATCH}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderConditions(formData.requestMatch.conditions)}
            <Button type="button" onClick={() => addCondition(formData.requestMatch.conditions)} className="mr-2 mt-2">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Condition
            </Button>
            <Button type="button" onClick={() => addConditionGroup(formData.requestMatch.conditions)} className="mt-2">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Group
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Action</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={formData.action.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, action: { type: value } }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{LABELS.FINGERPRINT_PARAMS}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.fingerprint.parameters[0]}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, fingerprint: { parameters: [value] } }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select parameter" />
              </SelectTrigger>
              <SelectContent>
                {FINGERPRINT_PARAMS.map((param) => (
                  <SelectItem key={`fingerprint-${param.value}`} value={param.value}>
                    <div className="flex items-center">
                      {param.label}
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="ml-2 h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{param.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Button type="button" onClick={generateObject}>
          Generate Object
        </Button>
        <Button type="button" onClick={saveConfig} className="ml-2">
          Save Config
        </Button>

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
  );
}
