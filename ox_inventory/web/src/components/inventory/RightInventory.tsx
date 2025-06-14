import React from 'react';
import InventoryGrid from './InventoryGrid';
import { useAppSelector } from '../../store';
import { selectRightInventory, selectRightInventoryCollapsed } from '../../store/inventory';

const RightInventory: React.FC = () => {
  const rightInventory = useAppSelector(selectRightInventory);
  const rightInventoryCollapsed = useAppSelector(selectRightInventoryCollapsed);

  return (
    <InventoryGrid 
      inventory={rightInventory} 
      isLeft={false}
      collapsed={rightInventoryCollapsed}
    />
  );
};

export default RightInventory;