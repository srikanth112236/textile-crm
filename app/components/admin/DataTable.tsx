'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';

// Enterprise compact density: tight rows, uppercase micro headers,
// single-line cells with truncation. Use for every admin list table.
export function AdminTable({ className, children }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="rounded-xl border bg-card overflow-x-auto">
      <Table className={cn('text-[13px]', className)}>{children}</Table>
    </div>
  );
}

export function AdminTableHead({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <TableHead
      className={cn(
        'h-9 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 whitespace-nowrap',
        className
      )}
      {...props}
    >
      {children}
    </TableHead>
  );
}

export function AdminTableRow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <TableRow className={cn('hover:bg-muted/50', className)} {...props}>
      {children}
    </TableRow>
  );
}

export function AdminTableCell({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <TableCell className={cn('px-3 py-2 align-middle', className)} {...props}>
      {children}
    </TableCell>
  );
}

export { TableBody as AdminTableBody, TableHeader as AdminTableHeader };
