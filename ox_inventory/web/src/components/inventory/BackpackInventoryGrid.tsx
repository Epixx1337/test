import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Inventory } from '../../typings';
import WeightBar from '../utils/WeightBar';
import InventorySlot from './InventorySlot';
import { getTotalWeight } from '../../helpers';
import { useAppSelector, useAppDispatch } from '../../store';
import { useIntersection } from '../../hooks/useIntersection';
import { toggleBackpackCollapsed } from '../../store/inventory';

const PAGE_SIZE = 30;

interface BackpackInventoryGridProps {
  inventory: Inventory;
  slot: number;
  collapsed: boolean;
}

const BackpackInventoryGrid: React.FC<BackpackInventoryGridProps> = ({ inventory, slot, collapsed }) => {
  const dispatch = useAppDispatch();
  const weight = useMemo(
    () => (inventory.maxWeight !== undefined ? Math.floor(getTotalWeight(inventory.items) * 1000) / 1000 : 0),
    [inventory.maxWeight, inventory.items]
  );
  const [page, setPage] = useState(0);
  const containerRef = useRef(null);
  const { ref, entry } = useIntersection({ threshold: 0.5 });
  const isBusy = useAppSelector((state) => state.inventory.isBusy);

  useEffect(() => {
    if (entry && entry.isIntersecting) {
      setPage((prev) => ++prev);
    }
  }, [entry]);

  const handleToggleCollapse = () => {
    dispatch(toggleBackpackCollapsed(slot));
  };

  return (
    <div className="backpack-inventory-grid-wrapper" style={{ pointerEvents: isBusy ? 'none' : 'auto' }}>
      <div>
        <div className="inventory-grid-header-wrapper backpack-header">
          <div className="backpack-header-content" onClick={handleToggleCollapse}>
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
        <div className="inventory-grid-container backpack-grid-container" ref={containerRef}>
          <>
            {inventory.items.slice(0, (page + 1) * PAGE_SIZE).map((item, index) => (
              <InventorySlot
                key={`backpack-${inventory.id}-${item.slot}`}
                item={item}
                ref={index === (page + 1) * PAGE_SIZE - 1 ? ref : null}
                inventoryType="stash" // Use stash type for proper DnD handling
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

export default BackpackInventoryGrid;