'use client';

import { cn } from '@/lib/utils';
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';

interface DropdownContextType {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error('DropdownMenu* components must be used within DropdownMenu');
  return ctx;
}

interface DropdownMenuProps {
  children: ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <DropdownContext.Provider value={{ open, toggle, close }}>
      <div ref={ref} className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

interface DropdownMenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
  onClick?: () => void;
}

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { toggle } = useDropdown();
    const handleClick = useCallback(() => {
      toggle();
      onClick?.();
    }, [toggle, onClick]);

    if (asChild) {
      const child = Children.only(children) as ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
      const existingOnClick = child.props.onClick;
      return cloneElement(child, {
        onClick: (e: React.MouseEvent) => {
          handleClick();
          existingOnClick?.(e);
        },
      });
    }

    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end';
}

export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = 'end', ...props }, ref) => {
    const { open } = useDropdown();
    if (!open) return null;
    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 mt-2 min-w-[12rem] rounded-lg border bg-popover p-1 text-popover-foreground shadow-md',
          align === 'end' ? 'right-0' : 'left-0',
          className
        )}
        {...props}
      />
    );
  }
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, onClick, ...props }, ref) => {
    const { close } = useDropdown();
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        close();
        onClick?.(e);
      },
      [close, onClick]
    );
    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={-1}
        onClick={handleClick}
        className={cn(
          'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0',
          className
        )}
        {...props}
      />
    );
  }
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
  )
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

const DropdownMenuLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
  )
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel };
