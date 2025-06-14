import { createSlice, PayloadAction, current } from '@reduxjs/toolkit';
import { RootState } from '.';
import { isPending, isFulfilled, isRejected } from '@reduxjs/toolkit';
import {
  moveSlotsReducer,
  refreshSlotsReducer,
  setupInventoryReducer,
  stackSlotsReducer,
  swapSlotsReducer,
} from '../reducers';
import { State, BackpackInventory } from '../typings';
import { Inventory } from '../typings';

const initialState: State = {
  leftInventory: {
    id: '',
    type: '',
    slots: 0,
    maxWeight: 0,
    items: [],
  },
  rightInventory: {
    id: '',
    type: '',
    slots: 0,
    maxWeight: 0,
    items: [],
  },
  additionalMetadata: new Array(),
  itemAmount: 0,
  shiftPressed: false,
  isBusy: false,
  backpackInventories: [],
  leftInventoryCollapsed: false,
  rightInventoryCollapsed: false,
};

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    stackSlots: stackSlotsReducer,
    swapSlots: swapSlotsReducer,
    setupInventory: setupInventoryReducer,
    moveSlots: moveSlotsReducer,
    refreshSlots: refreshSlotsReducer,
    setAdditionalMetadata: (state, action: PayloadAction<Array<{ metadata: string; value: string }>>) => {
      const metadata = [];

      for (let i = 0; i < action.payload.length; i++) {
        const entry = action.payload[i];
        if (!state.additionalMetadata.find((el) => el.value === entry.value)) metadata.push(entry);
      }

      state.additionalMetadata = [...state.additionalMetadata, ...metadata];
    },
    setItemAmount: (state, action: PayloadAction<number>) => {
      state.itemAmount = action.payload;
    },
    setShiftPressed: (state, action: PayloadAction<boolean>) => {
      state.shiftPressed = action.payload;
    },
    setContainerWeight: (state, action: PayloadAction<number>) => {
      const container = state.leftInventory.items.find((item) => item.metadata?.container === state.rightInventory.id);

      if (!container) return;

      container.weight = action.payload;
    },
    addBackpackInventory: (state, action: PayloadAction<{ slot: number; inventory: Inventory; container: string }>) => {
      const { slot, inventory, container } = action.payload;
      
      // Remove any existing backpack for this slot
      state.backpackInventories = state.backpackInventories.filter(bp => bp.slot !== slot);
      
      // Add the new backpack inventory
      state.backpackInventories.push({
        slot,
        inventory,
        container,
        collapsed: false,
      });
    },
    removeBackpackInventory: (state, action: PayloadAction<number>) => {
      const slot = action.payload;
      state.backpackInventories = state.backpackInventories.filter(bp => bp.slot !== slot);
    },
    toggleBackpackCollapsed: (state, action: PayloadAction<number>) => {
      const slot = action.payload;
      const backpack = state.backpackInventories.find(bp => bp.slot === slot);
      if (backpack) {
        backpack.collapsed = !backpack.collapsed;
      }
    },
    toggleLeftInventoryCollapsed: (state) => {
      state.leftInventoryCollapsed = !state.leftInventoryCollapsed;
    },
    toggleRightInventoryCollapsed: (state) => {
      state.rightInventoryCollapsed = !state.rightInventoryCollapsed;
    },
    updateBackpackInventory: (state, action: PayloadAction<{ container: string; inventory: Inventory }>) => {
      const { container, inventory } = action.payload;
      const backpack = state.backpackInventories.find(bp => bp.container === container);
      if (backpack) {
        backpack.inventory = inventory;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(isPending, (state) => {
      state.isBusy = true;

      state.history = {
        leftInventory: current(state.leftInventory),
        rightInventory: current(state.rightInventory),
      };
    });
    builder.addMatcher(isFulfilled, (state) => {
      state.isBusy = false;
    });
    builder.addMatcher(isRejected, (state) => {
      if (state.history && state.history.leftInventory && state.history.rightInventory) {
        state.leftInventory = state.history.leftInventory;
        state.rightInventory = state.history.rightInventory;
      }
      state.isBusy = false;
    });
  },
});

export const {
  setAdditionalMetadata,
  setItemAmount,
  setShiftPressed,
  setupInventory,
  swapSlots,
  moveSlots,
  stackSlots,
  refreshSlots,
  setContainerWeight,
  addBackpackInventory,
  removeBackpackInventory,
  toggleBackpackCollapsed,
  toggleLeftInventoryCollapsed,
  toggleRightInventoryCollapsed,
  updateBackpackInventory,
} = inventorySlice.actions;

export const selectLeftInventory = (state: RootState) => state.inventory.leftInventory;
export const selectRightInventory = (state: RootState) => state.inventory.rightInventory;
export const selectItemAmount = (state: RootState) => state.inventory.itemAmount;
export const selectIsBusy = (state: RootState) => state.inventory.isBusy;
export const selectBackpackInventories = (state: RootState) => state.inventory.backpackInventories;
export const selectLeftInventoryCollapsed = (state: RootState) => state.inventory.leftInventoryCollapsed;
export const selectRightInventoryCollapsed = (state: RootState) => state.inventory.rightInventoryCollapsed;

export default inventorySlice.reducer;