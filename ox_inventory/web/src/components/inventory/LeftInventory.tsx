import React from 'react';
import InventoryGrid from './InventoryGrid';
import BackpackInventoryGrid from './BackpackInventoryGrid';
import { useAppSelector } from '../../store';
import { selectLeftInventory, selectBackpackInventories, selectLeftInventoryCollapsed } from '../../store/inventory';

const LeftInventory: React.FC = () => {
  const leftInventory = useAppSelector(selectLeftInventory);
  const backpackInventories = useAppSelector(selectBackpackInventories);
  const leftInventoryCollapsed = useAppSelector(selectLeftInventoryCollapsed);

  const hasBackpack = backpackInventories.length > 0;

  return (
    <div className="left-inventory-wrapper">
      <InventoryGrid 
        inventory={leftInventory} 
        isLeft={true} 
        collapsed={leftInventoryCollapsed}
        hasBackpack={hasBackpack}
      />
      
      {/* Render backpack inventories below the main inventory */}
      {hasBackpack && (
        <div className="backpack-inventories-container">
          {backpackInventories.map((backpack) => (
            <BackpackInventoryGrid
              key={`backpack-${backpack.slot}-${backpack.container}`}
              inventory={backpack.inventory}
              slot={backpack.slot}
              collapsed={backpack.collapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LeftInventory;