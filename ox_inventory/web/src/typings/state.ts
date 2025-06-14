import { Inventory } from './inventory';
import { Slot } from './slot';

export type BackpackInventory = {
  slot: number;
  inventory: Inventory;
  container: string;
  collapsed: boolean;
};

export type State = {
  leftInventory: Inventory;
  rightInventory: Inventory;
  itemAmount: number;
  shiftPressed: boolean;
  isBusy: boolean;
  additionalMetadata: Array<{ metadata: string; value: string }>;
  history?: {
    leftInventory: Inventory;
    rightInventory: Inventory;
  };
  backpackInventories: BackpackInventory[];
  leftInventoryCollapsed: boolean;
  rightInventoryCollapsed: boolean;
};