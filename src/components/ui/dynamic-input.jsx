// components
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'

import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

const DynamicInput = ({ inputs, handleSelectChange, handleChange }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {inputs.map((input) => {
        // ────────────────────────────────────────────────────────────────
        // MULTI-SELECT (DropdownMenu with Checkbox Items)
        // ────────────────────────────────────────────────────────────────
        if (input.type === 'select' && input.multiple) {
          const selectedValues = Array.isArray(input.value) ? input.value : []
          const labelText =
            selectedValues.length > 0
              ? `${selectedValues.length} selected`
              : input.placeholder || 'Select options'

          return (
            <div key={input.htmlFor} className="space-y-2">
              <Label htmlFor={input.htmlFor}>{input.label}</Label>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between border-[#d3d3d3] font-normal text-sm"
                  >
                    <span>{labelText}</span>
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-[var(--radix-dropdown-menu-trigger-width)]"
                  align="start"
                >
                  {input.options?.map((option) => {
                    const isChecked = selectedValues.includes(option.value)
                    return (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          let newValues = [...selectedValues]
                          if (checked) {
                            newValues.push(option.value)
                          } else {
                            newValues = newValues.filter(
                              (v) => v !== option.value
                            )
                          }
                          handleSelectChange(input.htmlFor, newValues)
                        }}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        }

        // ────────────────────────────────────────────────────────────────
        // SINGLE-SELECT (shadcn Select)
        // ────────────────────────────────────────────────────────────────
        if (input.type === 'select') {
          return (
            <div key={input.htmlFor} className="space-y-2">
              <Label htmlFor={input.htmlFor}>{input.label}</Label>
              <Select
                value={input.value}
                onValueChange={(value) =>
                  handleSelectChange(input.htmlFor, value)
                }
              >
                <SelectTrigger
                  id={input.htmlFor}
                  className="w-full border-[#d3d3d3]"
                >
                  <SelectValue placeholder={input.placeholder} />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {input.options?.map((option) => (
                    <SelectItem
                      className="w-full"
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }

        // ────────────────────────────────────────────────────────────────
        // TEXT / NUMBER / DEFAULT INPUTS
        // ────────────────────────────────────────────────────────────────
        return (
          <div key={input.htmlFor} className="space-y-2">
            <Label htmlFor={input.htmlFor}>{input.label}</Label>
            <Input
              id={input.htmlFor}
              name={input.htmlFor}
              value={input.value}
              placeholder={input.placeholder || ''}
              type={input.type || 'text'}
              onChange={handleChange}
              readOnly={input.readOnly || false}
              className={`${
                input.readOnly ? 'bg-muted' : 'bg-white'
              } border-[#d3d3d3]`}
            />
          </div>
        )
      })}
    </div>
  )
}

export default DynamicInput

// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'

// const DynamicInput = ({ inputs, handleSelectChange, handleChange }) => {
//   return (
//     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//       {inputs.map((input) =>
//         input.type === 'select' ? (
//           <div className="space-y-2" key={input.htmlFor}>
//             <Label htmlFor={input.htmlFor}>{input.label}</Label>
//             <Select
//               value={input.value}
//               onValueChange={(value) =>
//                 handleSelectChange(input.htmlFor, value)
//               }
//             >
//               <SelectTrigger
//                 id={input.htmlFor}
//                 className="w-full border-[#d3d3d3]"
//               >
//                 <SelectValue placeholder={input.placeholder} />
//               </SelectTrigger>
//               <SelectContent>
//                 {input?.options.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         ) : (
//           <div key={input.htmlFor} className="space-y-2">
//             <Label htmlFor={input.htmlFor}>{input.label}</Label>
//             <Input
//               id={input.htmlFor}
//               name={input.htmlFor}
//               value={input.value}
//               placeholder={input.placeholder || ''}
//               type={input.type || 'text'}
//               onChange={handleChange}
//               readOnly={input.readOnly ? input.readOnly : false}
//               className={`${
//                 input.readOnly ? 'bg-muted' : 'bg-white'
//               } border-[#d3d3d3]`}
//             />
//           </div>
//         )
//       )}
//     </div>
//   )
// }

// export default DynamicInput
