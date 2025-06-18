import { canStack, findAvailableSlot, getTargetInventory, isSlotWithItem } from '../helpers';
import { validateMove } from '../thunks/validateItems';
import { store } from '../store';
import { DragSource, DropTarget, InventoryType, SlotWithItem } from '../typings';
import { moveSlots, stackSlots, swapSlots } from '../store/inventory';
import { Items } from '../store/items';

// Validation functions for slot restrictions (bespoke slots)
const isValidItemForSlot = (item: SlotWithItem, slot: number): boolean => {
  const itemName = item.name.toLowerCase();
  
  switch (slot) {
    case 1:
    case 2:
      // Only weapons - check multiple ways:
      // 1. Check if item has weapon property set to true (using any to bypass type checking)
      // 2. Fallback to checking if name starts with "weapon_"
      const itemData = Items[item.name] as any;
      const itemDataUpper = Items[item.name.toUpperCase()] as any;
      const isWeaponByProperty = itemData?.weapon === true || itemDataUpper?.weapon === true;
      const isWeaponByName = item.name.toLowerCase().startsWith('weapon_');
      return isWeaponByProperty || isWeaponByName;
    
    case 6:
      // Only specific backpacks - updated for our custom backpacks
      const backpacks = [
        'small_backpack',
        'medium_backpack', 
        'large_backpack',
        'tactical_backpack',
        'hiking_backpack'
      ];
      return backpacks.includes(itemName);
    
    case 7:
      // Only parachutes
      return itemName.includes('parachute');
    
    case 8:
      // Only armor/armour
      return itemName.includes('armour') || itemName.includes('armor');
    
    case 9:
      // Only phones
      return itemName.includes('phone');
    
    default:
      return true;
  }
};

// Check if slot is a bespoke slot (1-9 for player inventory)
const isBespokeSlot = (inventoryType: string, slot: number): boolean => {
  return inventoryType === 'player' && slot >= 1 && slot <= 9;
};

// NEW: Helper function to check if an item is a backpack
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

export const onDrop = (source: DragSource, target?: DropTarget) => {
  const { inventory: state } = store.getState();

  const { sourceInventory, targetInventory } = getTargetInventory(state, source.inventory, target?.inventory);

  const sourceSlot = sourceInventory.items[source.item.slot - 1] as SlotWithItem;

  const sourceData = Items[sourceSlot.name];

  if (sourceData === undefined) return console.error(`${sourceSlot.name} item data undefined!`);

  // If dragging from container slot
  if (sourceSlot.metadata?.container !== undefined) {
    // Prevent storing container in container
    if (targetInventory.type === InventoryType.CONTAINER)
      return console.log(`Cannot store container ${sourceSlot.name} inside another container`);

    // UPDATED: Allow backpack swapping in slot 6 even when opened
    // Only prevent dragging if it's NOT a backpack being moved to/from slot 6
    const isBackpackInSlot6 = isBackpack(sourceSlot.name) && (sourceSlot.slot === 6 || (target && target.item.slot === 6));
    
    if (!isBackpackInSlot6 && state.rightInventory.id === sourceSlot.metadata.container) {
      return console.log(`Cannot move container ${sourceSlot.name} when opened`);
    }
    
    // Log backpack swapping for debugging
    if (isBackpackInSlot6) {
      console.log(`🎒 Allowing backpack swap: ${sourceSlot.name} (slot ${sourceSlot.slot})`);
    }
  }

  const targetSlot = target
    ? targetInventory.items[target.item.slot - 1]
    : findAvailableSlot(sourceSlot, sourceData, targetInventory.items);

  if (targetSlot === undefined) return console.error('Target slot undefined!');

  // UPDATED: Allow swapping with backpack containers in slot 6 when opened
  if (targetSlot.metadata?.container !== undefined && state.rightInventory.id === targetSlot.metadata.container) {
    const isTargetBackpackInSlot6 = targetSlot.name && isBackpack(targetSlot.name) && targetSlot.slot === 6;
    
    if (!isTargetBackpackInSlot6) {
      return console.log(`Cannot swap item ${sourceSlot.name} with container ${targetSlot.name} when opened`);
    }
    
    // Log backpack swapping for debugging
    console.log(`🎒 Allowing swap with backpack container: ${targetSlot.name} (slot ${targetSlot.slot})`);
  }

  // NEW: Check bespoke slot restrictions
  if (target && isBespokeSlot(target.inventory, targetSlot.slot)) {
    if (!isValidItemForSlot(sourceSlot, targetSlot.slot)) {
      console.log(`Item ${sourceSlot.name} is not valid for bespoke slot ${targetSlot.slot}`);
      return; // Prevent the drop
    }
  }

  // If swapping items and the source is also a bespoke slot, validate the swap target
  if (target && isSlotWithItem(targetSlot, true) && isBespokeSlot(source.inventory, sourceSlot.slot)) {
    if (!isValidItemForSlot(targetSlot, sourceSlot.slot)) {
      console.log(`Item ${targetSlot.name} is not valid for bespoke slot ${sourceSlot.slot} during swap`);
      return; // Prevent the swap
    }
  }

  const count =
    state.shiftPressed && sourceSlot.count > 1 && sourceInventory.type !== 'shop'
      ? Math.floor(sourceSlot.count / 2)
      : state.itemAmount === 0 || state.itemAmount > sourceSlot.count
      ? sourceSlot.count
      : state.itemAmount;

  const data = {
    fromSlot: sourceSlot,
    toSlot: targetSlot,
    fromType: sourceInventory.type,
    toType: targetInventory.type,
    count: count,
  };

  store.dispatch(
    validateMove({
      ...data,
      fromSlot: sourceSlot.slot,
      toSlot: targetSlot.slot,
    })
  );

  isSlotWithItem(targetSlot, true)
    ? sourceData.stack && canStack(sourceSlot, targetSlot)
      ? store.dispatch(
          stackSlots({
            ...data,
            toSlot: targetSlot,
          })
        )
      : store.dispatch(
          swapSlots({
            ...data,
            toSlot: targetSlot,
          })
        )
    : store.dispatch(moveSlots(data));
};