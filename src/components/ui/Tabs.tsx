import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/utils/cn'

export const Tabs = TabsPrimitive.Root

export interface TabsListProps {
  items: readonly { value: string; label: string }[]
  'aria-label': string
  className?: string
}

export function TabsList({ items, className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn('flex items-center gap-4 border-b border-line', className)}
      {...props}
    >
      {items.map((item) => (
        <TabsPrimitive.Trigger
          key={item.value}
          value={item.value}
          className={cn(
            '-mb-px cursor-pointer border-b-2 border-transparent px-1 pb-2 text-sm text-muted',
            'transition-colors duration-150 hover:text-fg',
            'data-[state=active]:border-accent data-[state=active]:text-fg',
          )}
        >
          {item.label}
        </TabsPrimitive.Trigger>
      ))}
    </TabsPrimitive.List>
  )
}

export const TabsContent = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('pt-4 focus:outline-none', className)} {...props} />
)
