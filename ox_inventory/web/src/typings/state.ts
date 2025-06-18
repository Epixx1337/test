import { Inventory } from './inventory';
import { Slot, SlotWithItem } from './slot';

export type State = {
  leftInventory: Inventory;
  rightInventory: Inventory;
  itemAmount: number;
  shiftPressed: boolean;
  isBusy: boolean;
  additionalMetadata: Array<{ metadata: string; value: string }>;
  openedRightBackpack: SlotWithItem | null; // Existing field for backpack tracking
  
  // NEW: Independent container data storage for Step 8
  leftBackpackData: Inventory | null;
  rightBackpackData: Inventory | null;
  lastContainerUpdate: number;
  
  history?: {
    leftInventory: Inventory;
    rightInventory: Inventory;
  };
};