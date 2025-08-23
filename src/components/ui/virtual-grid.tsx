import React, { memo, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';

interface VirtualGridProps {
  items: any[];
  itemHeight: number;
  itemWidth: number;
  containerHeight: number;
  containerWidth: number;
  columnCount: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  gap?: number;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    items: any[];
    columnCount: number;
    renderItem: (item: any, index: number) => React.ReactNode;
    gap: number;
  };
}

const GridItem = memo<GridItemProps>(({ columnIndex, rowIndex, style, data }) => {
  const { items, columnCount, renderItem, gap } = data;
  const index = rowIndex * columnCount + columnIndex;
  
  if (index >= items.length) {
    return null;
  }

  const item = items[index];
  
  return (
    <div
      style={{
        ...style,
        left: (style.left as number) + (gap * columnIndex),
        top: (style.top as number) + (gap * rowIndex),
        width: (style.width as number) - gap,
        height: (style.height as number) - gap,
      }}
    >
      {renderItem(item, index)}
    </div>
  );
});

GridItem.displayName = 'GridItem';

export const VirtualGrid = memo<VirtualGridProps>(({
  items,
  itemHeight,
  itemWidth,
  containerHeight,
  containerWidth,
  columnCount,
  renderItem,
  gap = 16
}) => {
  const rowCount = Math.ceil(items.length / columnCount);
  
  const itemData = useMemo(
    () => ({
      items,
      columnCount,
      renderItem,
      gap
    }),
    [items, columnCount, renderItem, gap]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={itemWidth + gap}
      height={containerHeight}
      width={containerWidth}
      rowCount={rowCount}
      rowHeight={itemHeight + gap}
      itemData={itemData}
    >
      {GridItem}
    </Grid>
  );
});

VirtualGrid.displayName = 'VirtualGrid';