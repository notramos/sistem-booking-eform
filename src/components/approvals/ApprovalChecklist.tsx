'use client'

import { ClipboardCheck } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ApprovalChecklistProps = {
  items: string[]
  checked: boolean[]
  onChange: (index: number, value: boolean) => void
}

export function ApprovalChecklist({ items, checked, onChange }: ApprovalChecklistProps) {
  const completed = checked.filter(Boolean).length

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Checklist sebelum keputusan
          </span>
          <span className="text-xs font-normal text-muted-foreground">{completed}/{items.length} selesai</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
        {items.map((item, index) => (
          <Checkbox
            key={item}
            id={`approval-check-${index}`}
            label={item}
            checked={checked[index] ?? false}
            onChange={(event) => onChange(index, event.target.checked)}
          />
        ))}
      </CardContent>
    </Card>
  )
}
