import React, { useState } from 'react';
import InventoryGrid from './InventoryGrid';
import BespokeSlots from './BespokeSlots';
import BackpackContainer from './BackpackContainer';
import { useAppSelector } from '../../store';
import { selectLeftInventory, selectIsBackpackEquipped } from '../../store/inventory';

const LeftInventory: React.FC = () => {
  const leftInventory = useAppSelector(selectLeftInventory);
  const isBackpackEquipped = useAppSelector(selectIsBackpackEquipped);
  const [isMainCollapsed, setIsMainCollapsed] = useState(false);

  const handleToggleMainCollapse = () => {
    setIsMainCollapsed(!isMainCollapsed);
  };

  return (
    <div className="left-inventory-wrapper">
      {/* Main inventory grid */}
      <InventoryGrid 
        inventory={leftInventory} 
        excludeBespokeSlots={true}
        maxRows={isBackpackEquipped ? 3 : undefined}
        isCollapsed={isMainCollapsed}
        onToggleCollapse={handleToggleMainCollapse}
      />
      
      {/* Backpack container (only shows when backpack is equipped in slot 6) */}
      {isBackpackEquipped && !isMainCollapsed && (
        <BackpackContainer position="left" />
      )}
      
      {/* Bespoke slots bar at the bottom */}
      <BespokeSlots />
    </div>
  );
};

export default LeftInventory;