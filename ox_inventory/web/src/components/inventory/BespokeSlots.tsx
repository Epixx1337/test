import React from 'react';
import { useAppSelector } from '../../store';
import { selectLeftInventory, selectIsBackpackEquipped } from '../../store/inventory';
import InventorySlot from './InventorySlot';
import { isSlotWithItem } from '../../helpers';

// Helper function to check if an item is a backpack
const isBackpack = (itemName: string): boolean => {
  const backpacks = [
    'small_backpack',
    'medium_backpack', 
    'large_backpack',
    'tactical_backpack',
    'hiking_backpack'
  ];
  return backpacks.includes(itemName.toLowerCase());
};

const BespokeSlots: React.FC = () => {
  const leftInventory = useAppSelector(selectLeftInventory);
  const isBackpackEquipped = useAppSelector(selectIsBackpackEquipped);
  
  // Get the bespoke slots (1-9) in order, ensuring all slots are present
  const bespokeSlots = Array.from({ length: 9 }, (_, index) => {
    const slotNumber = index + 1;
    return leftInventory.items.find(item => item.slot === slotNumber) || { slot: slotNumber };
  });

  return (
    <div className="bespoke-slots-container">
      <div className="bespoke-slots-wrapper">
        {bespokeSlots.map((item) => {
          // Check if this is slot 6 with a backpack equipped
          const isSlot6WithBackpack = item.slot === 6 && 
            isSlotWithItem(item) && 
            isBackpack(item.name);

          return (
            <div 
              key={`bespoke-slot-${item.slot}`} 
              className={`bespoke-slot ${isSlot6WithBackpack ? 'has-backpack-equipped' : ''}`}
              data-slot={item.slot}
            >
              <InventorySlot
                item={item}
                inventoryType={leftInventory.type}
                inventoryGroups={leftInventory.groups || {}}
                inventoryId={leftInventory.id}
              />
              {/* Visual indicator for equipped backpack */}
              {isSlot6WithBackpack && (
                <div className="backpack-equipped-indicator">
                  <span>●</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BespokeSlots;