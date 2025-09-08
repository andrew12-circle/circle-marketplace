import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';

interface Column<T> {
  key: keyof T;
  header: string;
  width?: number;
  render?: (value: any, item: T) => React.ReactNode;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  height?: number;
  itemHeight?: number;
  loading?: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
}

export function VirtualizedTable<T extends Record<string, any>>({
  data,
  columns,
  height = 600,
  itemHeight = 60,
  loading = false,
  onLoadMore,
  hasNextPage = false,
}: VirtualizedTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 10,
  });

  const items = virtualizer.getVirtualItems();

  // Load more when approaching the end
  React.useEffect(() => {
    const lastItem = items[items.length - 1];
    if (
      lastItem &&
      lastItem.index >= data.length - 5 &&
      hasNextPage &&
      !loading &&
      onLoadMore
    ) {
      onLoadMore();
    }
  }, [items, data.length, hasNextPage, loading, onLoadMore]);

  const totalSize = virtualizer.getTotalSize();
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <Card className="overflow-hidden">
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: `${height}px` }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={String(column.key)} 
                  style={{ width: column.width }}
                  className="bg-background"
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        
        <div style={{ height: `${totalSize}px`, position: 'relative' }}>
          <Table>
            <TableBody>
              {virtualItems.map((virtualRow) => {
                const item = data[virtualRow.index];
                if (!item) return null;

                return (
                  <TableRow
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell 
                        key={String(column.key)}
                        style={{ width: column.width }}
                      >
                        {column.render 
                          ? column.render(item[column.key], item)
                          : String(item[column.key] || '')
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
          </div>
        )}
      </div>
    </Card>
  );
}