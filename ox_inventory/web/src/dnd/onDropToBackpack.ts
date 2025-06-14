import { fetchNui } from '../utils/fetchNui';
import { DragSource, DropTarget } from '../typings';

export const onDropToBackpack = (source: DragSource, target: DropTarget & { inventoryId: string }) => {
  if (!source.item || source.inventory === target.inventory) return;

  fetchNui('swapSlots', {
    fromInventory: source.inventory,
    fromSlot: source.item.slot,
    toInventory: target.inventory,
    toSlot: target.item.slot,
    toType: target.inventory,
    fromType: source.inventory,
    count: 0,
  });
};