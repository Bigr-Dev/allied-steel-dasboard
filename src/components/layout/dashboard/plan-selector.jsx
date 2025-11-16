'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useState } from 'react'
const plans = [
  {
    value: 'next.js',
    label: 'Next.js',
  },
  {
    value: 'sveltekit',
    label: 'SvelteKit',
  },
  {
    value: 'nuxt.js',
    label: 'Nuxt.js',
  },
  {
    value: 'remix',
    label: 'Remix',
  },
  {
    value: 'astro',
    label: 'Astro',
  },
]

const PlanSelector = ({ selectedPlanId, handleSelectChange, plans }) => {
  const [open, setOpen] = useState(false)
  // const [value, setValue] = useState(selectedPlanId)
  // console.log('plans :>> ', plans)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between bg-white"
        >
          {selectedPlanId
            ? plans.find((plan) => plan.value === selectedPlanId)?.label
            : 'Select Plan...'}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search plan..." className="h-9" />
          <CommandList>
            <CommandEmpty>No plan found.</CommandEmpty>
            <CommandGroup>
              {plans.length > 0 &&
                plans?.map((plan) => (
                  <CommandItem
                    key={plan.value}
                    value={plan.value}
                    onSelect={(currentValue) => {
                      handleSelectChange('selectedPlanId', currentValue)
                      // setValue(currentValue === value ? '' : currentValue)
                      setOpen(false)
                    }}
                  >
                    {plan.label}
                    <Check
                      className={cn(
                        'ml-auto',
                        selectedPlanId === plan.value
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default PlanSelector
