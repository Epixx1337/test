import React, { useState, useEffect } from 'react';
import useNuiEvent from '../../hooks/useNuiEvent';
import InventoryControl from './InventoryControl';
import InventoryHotbar from './InventoryHotbar';
import { useAppDispatch } from '../../store';
import { refreshSlots, setAdditionalMetadata, setupInventory, closeRightBackpack } from '../../store/inventory';
import { useExitListener } from '../../hooks/useExitListener';
import type { Inventory as InventoryProps } from '../../typings';
import RightInventory from './RightInventory';
import LeftInventory from './LeftInventory';
import Tooltip from '../utils/Tooltip';
import { closeTooltip } from '../../store/tooltip';
import InventoryContext from './InventoryContext';
import { closeContextMenu } from '../../store/contextMenu';
import Fade from '../utils/transitions/Fade';
// NEW: Import the container interceptor
import { useContainerInterceptor } from '../../hooks/useContainerInterceptor';

const Inventory: React.FC = () => {
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const dispatch = useAppDispatch();

  // NEW: Add the interceptor hook at the top of the component
  useContainerInterceptor();

  useNuiEvent<boolean>('setInventoryVisible', setInventoryVisible);
  useNuiEvent<false>('closeInventory', () => {
    setInventoryVisible(false);
    dispatch(closeContextMenu());
    dispatch(closeTooltip());
    dispatch(closeRightBackpack()); // Close any open right-side backpacks
  });
  useExitListener(setInventoryVisible);

  useNuiEvent<{
    leftInventory?: InventoryProps;
    rightInventory?: InventoryProps;
  }>('setupInventory', (data) => {
    dispatch(setupInventory(data));
    !inventoryVisible && setInventoryVisible(true);
  });

  useNuiEvent('refreshSlots', (data) => dispatch(refreshSlots(data)));

  useNuiEvent('displayMetadata', (data: Array<{ metadata: string; value: string }>) => {
    dispatch(setAdditionalMetadata(data));
  });

  // ===== SIMPLIFIED: Basic Backpack Event Handlers (No Complex State Management) =====

  // Handle backpack container opened events - SIMPLIFIED
  useNuiEvent<{ containerId: string; position: string; success: boolean }>('backpackContainerOpened', (data) => {
    console.log(`✅ Backpack container opened:`, data);
    
    if (!data || !data.containerId) {
      console.error(`❌ Invalid backpack opened data:`, data);
      return;
    }
    
    // Simple window event dispatch
    const customEvent = new CustomEvent('backpackContainerOpened', {
      detail: data
    });
    window.dispatchEvent(customEvent);
    console.log(`🎯 Dispatched backpack opened event for:`, data.containerId);
  });

  // Handle backpack container closed events - SIMPLIFIED
  useNuiEvent<{ containerId: string; position: string; success: boolean }>('backpackContainerClosed', (data) => {
    console.log(`❌ Backpack container closed:`, data);
    
    if (!data || !data.containerId) {
      console.error(`❌ Invalid backpack closed data:`, data);
      return;
    }
    
    // Simple window event dispatch
    const customEvent = new CustomEvent('backpackContainerClosed', {
      detail: data
    });
    window.dispatchEvent(customEvent);
    console.log(`🎯 Dispatched backpack closed event for:`, data.containerId);
  });

  // Handle clearing UI for inventory operations
  useNuiEvent('clearForInventory', (data) => {
    console.log(`🧹 Clearing UI for inventory operation`);
    
    // Dispatch clear event
    const customEvent = new CustomEvent('clearForInventory', {
      detail: { force: data?.force || false }
    });
    window.dispatchEvent(customEvent);
  });

  // ===== END Simplified Backpack Event Handlers =====

  // Handle inventory closing properly
  const handleInventoryClose = () => {
    setInventoryVisible(false);
    dispatch(closeContextMenu());
    dispatch(closeTooltip());
    dispatch(closeRightBackpack());
  };

  // Listen for ESC key to close inventory
  useExitListener(handleInventoryClose);

  return (
    <>
      <Fade in={inventoryVisible}>
        <div className="inventory-wrapper">
          <LeftInventory />
          <InventoryControl />
          <RightInventory />
          <Tooltip />
          <InventoryContext />
        </div>
      </Fade>
      <InventoryHotbar />
    </>
  );
};

export default Inventory;