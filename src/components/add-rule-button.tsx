import React from 'react'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

interface AddRuleButtonProps {
  onClick: () => void
  isLoading: boolean
}

export function AddRuleButton({ onClick, isLoading }: AddRuleButtonProps) {
  return (
    <Button onClick={onClick} className="mb-4" disabled={isLoading}>
      <PlusCircle className="mr-2 h-4 w-4" /> Add New Rule
    </Button>
  )
}
