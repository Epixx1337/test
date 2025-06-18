import React from 'react';
import { useAppSelector } from '../../store';
import { selectRightInventory, selectOpenedRightBackpack } from '../../store/inventory';
import InventoryGrid from './InventoryGrid';
import BackpackContainer from './BackpackContainer';

const RightInventory: React.FC = () => {
  const rightInventory = useAppSelector(selectRightInventory);
  const openedRightBackpack = useAppSelector(selectOpenedRightBackpack);

  return (
    <div className="right-inventory-wrapper">
      {/* Show regular right inventory if there's a right inventory */}
      {rightInventory && (
        <InventoryGrid
          inventory={rightInventory}
          maxRows={openedRightBackpack ? 3 : undefined}
        />
      )}
      
      {/* Show backpack container BELOW the right inventory */}
      {openedRightBackpack && (
        <div className="right-backpack-wrapper">
          <BackpackContainer 
            position="right" 
          />
        </div>
      )}
    </div>
  );
};

export default RightInventory;