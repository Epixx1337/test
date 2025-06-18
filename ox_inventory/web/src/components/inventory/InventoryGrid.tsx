import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Inventory } from '../../typings';
import WeightBar from '../utils/WeightBar';
import InventorySlot from './InventorySlot';
import { getTotalWeight } from '../../helpers';
import { useAppSelector } from '../../store';
import { useIntersection } from '../../hooks/useIntersection';

const PAGE_SIZE = 30;

interface InventoryGridProps {
  inventory: Inventory;
  excludeBespokeSlots?: boolean;
  maxRows?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  title?: string;
}

const InventoryGrid: React.FC<InventoryGridProps> = ({ 
  inventory, 
  excludeBespokeSlots = false,
  maxRows,
  isCollapsed = false,
  onToggleCollapse,
  title
}) => {
  const weight = useMemo(
    () => (inventory.maxWeight !== undefined ? Math.floor(getTotalWeight(inventory.items) * 1000) / 1000 : 0),
    [inventory.maxWeight, inventory.items]
  );
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({ threshold: 0.5 });
  const isBusy = useAppSelector((state) => state.inventory.isBusy);

  // Filter out bespoke slots (1-9) if this is the player inventory and excludeBespokeSlots is true
  const filteredItems = useMemo(() => {
    if (excludeBespokeSlots && inventory.type === 'player') {
      return inventory.items.filter(item => item.slot < 1 || item.slot > 9);
    }
    return inventory.items;
  }, [inventory.items, inventory.type, excludeBespokeSlots]);

  // Calculate dynamic height based on maxRows
  const containerHeight = useMemo(() => {
    if (!maxRows) return undefined;
    const gridSize = 'calc(10.2vh + 0.22vh)'; // $gridSize + row gap
    const gap = '2px'; // $gridGap
    return `calc(${maxRows} * ${gridSize} + ${maxRows - 1} * ${gap})`;
  }, [maxRows]);

  useEffect(() => {
    if (entry && entry.isIntersecting) {
      setPage((prev) => ++prev);
    }
  }, [entry]);

  if (isCollapsed) {
    return (
      <div className="inventory-grid-wrapper collapsed" style={{ pointerEvents: isBusy ? 'none' : 'auto' }}>
        <div className="inventory-grid-header-wrapper">
          <p>{title || inventory.label}</p>
          <div className="inventory-controls">
            {inventory.maxWeight && (
              <p>
                {weight / 1000}/{inventory.maxWeight / 1000}kg
              </p>
            )}
            {onToggleCollapse && (
              <button className="collapse-toggle" onClick={onToggleCollapse}>
                ▼
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="inventory-grid-wrapper" style={{ pointerEvents: isBusy ? 'none' : 'auto' }}>
        <div>
          <div className="inventory-grid-header-wrapper">
            <p>{title || inventory.label}</p>
            <div className="inventory-controls">
              {inventory.maxWeight && (
                <p>
                  {weight / 1000}/{inventory.maxWeight / 1000}kg
                </p>
              )}
              {onToggleCollapse && (
                <button className="collapse-toggle" onClick={onToggleCollapse}>
                  ▲
                </button>
              )}
            </div>
          </div>
          <WeightBar percent={inventory.maxWeight ? (weight / inventory.maxWeight) * 100 : 0} />
        </div>
        <div 
          className={`inventory-grid-container ${maxRows ? 'limited-rows' : ''}`}
          ref={containerRef}
          style={maxRows ? { 
            height: containerHeight,
            maxHeight: containerHeight,
            overflowY: 'auto',
            overflowX: 'hidden'
          } : undefined}
        >
          <>
            {filteredItems.slice(0, (page + 1) * PAGE_SIZE).map((item, index) => (
              <InventorySlot
                key={`${inventory.type}-${inventory.id}-${item.slot}`}
                item={item}
                ref={index === (page + 1) * PAGE_SIZE - 1 ? ref : null}
                inventoryType={inventory.type}
                inventoryGroups={inventory.groups}
                inventoryId={inventory.id}
              />
            ))}
          </>
        </div>
      </div>
    </>
  );
};

export default InventoryGrid;