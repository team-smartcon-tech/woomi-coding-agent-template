import type { InputHTMLAttributes, Ref } from "react"
import { cn } from "~/shared/lib/cn"

// ref 를 받으면 indeterminate(부분 선택) 상태를 DOM 에 설정할 수 있다(전체 선택 헤더 등).
export type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }

export function Checkbox({ className, ref, ...props }: CheckboxProps) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn("size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  )
}
