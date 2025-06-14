import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Inventory } from '../../typings';
import WeightBar from '../utils/WeightBar';
import InventorySlot from './InventorySlot';
import { getTotalWeight } from '../../helpers';
import { useAppSelector, useAppDispatch } from '../../store';
import { useIntersection } from '../../hooks/useIntersection';
import { toggleLeftInventoryCollapsed, toggleRightInventoryCollapsed } from '../../store/inventory';

const PAGE_SIZE = 30;

interface InventoryGridProps {
  inventory: Inventory;
  isLeft?: boolean;
  collapsed?: boolean;
  hasBackpack?: boolean;
}

const InventoryGrid: React.FC<InventoryGridProps> = ({ inventory, isLeft = false, collapsed = false, hasBackpack = false }) => {
  const dispatch = useAppDispatch();
  const weight = useMemo(
    () => (inventory.maxWeight !== undefined ? Math.floor(getTotalWeight(inventory.items) * 1000) / 1000 : 0),
    [inventory.maxWeight, inventory.items]
  );
  const [page, setPage] = useState(0);
  const containerRef = useRef(null);
  const { ref, entry } = useIntersection({ threshold: 0.5 });
  const isBusy = useAppSelector((state) => state.inventory.isBusy);

  // Filter out slots 1-9 for player inventory - they will be shown in separate hotbar container
  // For left inventory with backpack, only show 3 rows (slots 10-37) instead of all
const filteredItems = useMemo(() => {
  if (inventory.type === 'player') {
    // Skip slots 1-9 and start from slot 10
    const items = inventory.items.slice(9);
    
    // Keep all items but adjust visible height with CSS when backpack is equipped
    // Don't actually remove items, just let CSS handle the visible area
    return items;
  }
  return inventory.items;
  }, [inventory.items, inventory.type, isLeft, hasBackpack]);

  useEffect(() => {
    if (entry && entry.isIntersecting) {
      setPage((prev) => ++prev);
    }
  }, [entry]);

  const handleToggleCollapse = () => {
    if (isLeft) {
      dispatch(toggleLeftInventoryCollapsed());
    } else {
      dispatch(toggleRightInventoryCollapsed());
    }
  };

  // Apply special grid height for left inventory with backpack
  const getGridClass = () => {
    let className = 'inventory-grid-container';
    if (isLeft && hasBackpack) {
      className += ' left-inventory-with-backpack';
    }
    return className;
  };

  return (
    <div className="inventory-grid-wrapper" style={{ pointerEvents: isBusy ? 'none' : 'auto' }}>
      <div>
        <div className="inventory-grid-header-wrapper">
          <div className="inventory-header-content" onClick={handleToggleCollapse}>
            <p>{inventory.label}</p>
            <span className="collapse-indicator">{collapsed ? '▼' : '▲'}</span>
          </div>
          {inventory.maxWeight && !collapsed && (
            <p>
              {weight / 1000}/{inventory.maxWeight / 1000}kg
            </p>
          )}
        </div>
        {!collapsed && <WeightBar percent={inventory.maxWeight ? (weight / inventory.maxWeight) * 100 : 0} />}
      </div>
      {!collapsed && (
        <div className={getGridClass()} ref={containerRef}>
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
      )}
    </div>
  );
};

export default InventoryGrid;