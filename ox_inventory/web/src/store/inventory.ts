import { createSlice, createSelector, PayloadAction, isPending, isFulfilled, isRejected, current } from '@reduxjs/toolkit';
import { RootState } from './index';
import {
  moveSlotsReducer,
  refreshSlotsReducer,
  setupInventoryReducer,
  stackSlotsReducer,
  swapSlotsReducer,
} from '../reducers';
import { State, SlotWithItem } from '../typings';
import { isSlotWithItem } from '../helpers';

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
  openedRightBackpack: null,
  
  // NEW: Step 8 additions
  leftBackpackData: null,
  rightBackpackData: null,
  lastContainerUpdate: 0,
};

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    stackSlots: stackSlotsReducer,
    swapSlots: swapSlotsReducer,
    setupInventory: setupInventoryReducer,
    moveSlots: moveSlotsReducer,
    refreshSlots: (state, action: PayloadAction<any>) => {
      // Call the original refreshSlots reducer
      refreshSlotsReducer(state, action);
      
      // NEW: Also update backpack data when slots are refreshed
      if (action.payload.items) {
        if (!Array.isArray(action.payload.items)) action.payload.items = [action.payload.items];
        
        // Check if this is a backpack container refresh
        const rightInventoryId = state.rightInventory?.id;
        const isBackpackContainer = rightInventoryId && rightInventoryId.includes('backpack_');
        
        if (isBackpackContainer) {
          // Get current equipped backpacks to determine which data to update
          const equippedBackpack = state.leftInventory.items.find(item => 
            item.slot === 6 && item.name && isSlotWithItem(item) && isBackpack(item.name)
          );
          const rightBackpack = state.openedRightBackpack;
          
          // Determine which backpack this container belongs to (same logic as interceptor)
          let targetPosition: 'left' | 'right' | null = null;
          
          if (equippedBackpack && equippedBackpack.name && rightInventoryId.includes(equippedBackpack.name)) {
            targetPosition = 'left';
          } else if (rightBackpack && rightBackpack.name && rightInventoryId.includes(rightBackpack.name)) {
            targetPosition = 'right';
          }
          
          if (targetPosition) {
            // Update the appropriate backpack data
            const currentBackpackData = targetPosition === 'left' ? state.leftBackpackData : state.rightBackpackData;
            
            if (currentBackpackData) {
              // Create updated backpack data
              const updatedBackpackData = {
                ...currentBackpackData,
                items: [...currentBackpackData.items]
              };
              
              // Update the specific slots that changed
              action.payload.items.forEach((data: any) => {
                if (data && data.inventory && data.inventory !== 'player') {
                  updatedBackpackData.items[data.item.slot - 1] = data.item;
                }
              });
              
              // Store the updated data
              if (targetPosition === 'left') {
                state.leftBackpackData = updatedBackpackData;
              } else {
                state.rightBackpackData = updatedBackpackData;
              }
              
              console.log(`[REFRESH] Updated ${targetPosition.toUpperCase()} backpack data`);
            }
          }
        }
      }
    },
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
    // FIXED: Keep existing setContainerWeight structure
    setContainerWeight: (state, action: PayloadAction<number>) => {
      const container = state.leftInventory.items.find((item) => item.metadata?.container === state.rightInventory.id);

      if (!container) return;

      container.weight = action.payload;
    },
    // Existing actions for right-side backpack management
    openRightBackpack: (state, action: PayloadAction<SlotWithItem>) => {
      state.openedRightBackpack = action.payload;
    },
    closeRightBackpack: (state) => {
      state.openedRightBackpack = null;
      // Also clear right backpack data when closing
      state.rightBackpackData = null;
    },
    
    // NEW: Step 8 Independent container data actions
    setLeftBackpackData: (state, action: PayloadAction<any>) => {
      state.leftBackpackData = action.payload;
      state.lastContainerUpdate = Date.now();
    },
    
    setRightBackpackData: (state, action: PayloadAction<any>) => {
      state.rightBackpackData = action.payload;
      state.lastContainerUpdate = Date.now();
    },
    
    clearBackpackData: (state, action: PayloadAction<'left' | 'right' | 'both'>) => {
      if (action.payload === 'left' || action.payload === 'both') {
        state.leftBackpackData = null;
      }
      if (action.payload === 'right' || action.payload === 'both') {
        state.rightBackpackData = null;
      }
      state.lastContainerUpdate = Date.now();
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

// Selector to get the equipped backpack in slot 6
export const selectEquippedBackpack = createSelector(
  [(state: RootState) => state.inventory.leftInventory.items],
  (items) => {
    const slot6 = items.find(item => item.slot === 6);
    if (slot6 && isSlotWithItem(slot6) && isBackpack(slot6.name)) {
      return slot6;
    }
    return null;
  }
);

// Selector to check if a backpack is equipped
export const selectIsBackpackEquipped = createSelector(
  [selectEquippedBackpack],
  (backpack) => backpack !== null
);

// Selector to get backpack container ID
export const selectBackpackContainerId = createSelector(
  [selectEquippedBackpack],
  (backpack) => backpack?.metadata?.container || null
);

// Selector to get the opened right-side backpack
export const selectOpenedRightBackpack = (state: RootState) => state.inventory.openedRightBackpack;

// Selector to check if a right-side backpack is open
export const selectIsRightBackpackOpen = createSelector(
  [selectOpenedRightBackpack],
  (backpack) => backpack !== null
);

// NEW: Step 8 selectors
export const selectLeftBackpackData = (state: RootState) => state.inventory.leftBackpackData;
export const selectRightBackpackData = (state: RootState) => state.inventory.rightBackpackData;
export const selectLastContainerUpdate = (state: RootState) => state.inventory.lastContainerUpdate;

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
  openRightBackpack,
  closeRightBackpack,
  // NEW: Step 8 actions
  setLeftBackpackData,
  setRightBackpackData,
  clearBackpackData,
} = inventorySlice.actions;

export const selectLeftInventory = (state: RootState) => state.inventory.leftInventory;
export const selectRightInventory = (state: RootState) => state.inventory.rightInventory;
export const selectItemAmount = (state: RootState) => state.inventory.itemAmount;
export const selectIsBusy = (state: RootState) => state.inventory.isBusy;

export default inventorySlice.reducer;