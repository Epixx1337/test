import React from 'react';
import { useAppSelector } from '../../store';
import { selectLeftInventory } from '../../store/inventory';
import InventorySlot from './InventorySlot';

const InventoryActionBar: React.FC = () => {
  const leftInventory = useAppSelector(selectLeftInventory);
  // Get only slots 1-9 for the action bar
  const actionBarItems = leftInventory.items.slice(0, 9);

  return (
    <div className="inventory-action-bar">
      <div className="inventory-action-bar-container">
        {actionBarItems.map((item) => (
          <InventorySlot
            key={`actionbar-${leftInventory.id}-${item.slot}`}
            item={item}
            inventoryType={leftInventory.type}
            inventoryGroups={leftInventory.groups}
            inventoryId={leftInventory.id}
          />
        ))}
      </div>
    </div>
  );
};

export default InventoryActionBar;