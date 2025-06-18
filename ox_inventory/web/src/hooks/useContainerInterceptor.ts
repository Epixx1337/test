import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setLeftBackpackData, setRightBackpackData, clearBackpackData } from '../store/inventory';
import { selectEquippedBackpack, selectOpenedRightBackpack } from '../store/inventory';

export const useContainerInterceptor = () => {
  const dispatch = useAppDispatch();
  const rightInventory = useAppSelector((state) => state.inventory.rightInventory);
  const equippedBackpack = useAppSelector(selectEquippedBackpack);
  const rightBackpack = useAppSelector(selectOpenedRightBackpack);
  
  const lastRightInventoryId = useRef<string | null>(null);
  const lastEquippedBackpackName = useRef<string | null>(null);

  useEffect(() => {
    // Only process if right inventory exists and has changed
    if (!rightInventory || rightInventory.id === lastRightInventoryId.current) {
      return;
    }

    console.log('[INTERCEPTOR] Right inventory changed:', rightInventory.id);
    lastRightInventoryId.current = rightInventory.id;

    // Check if this is a backpack container
    const isBackpackContainer = rightInventory.id?.includes('backpack_');
    
    if (!isBackpackContainer) {
      console.log('[INTERCEPTOR] Not a backpack container, ignoring');
      return;
    }

    // Determine which backpack this container belongs to
    let targetPosition: 'left' | 'right' | null = null;
    
    // Check if it matches the equipped backpack (left position)
    if (equippedBackpack && rightInventory.id.includes(equippedBackpack.name)) {
      targetPosition = 'left';
      console.log('[INTERCEPTOR] Container belongs to LEFT backpack:', equippedBackpack.name);
    }
    
    // Check if it matches the right-clicked backpack (right position)  
    if (rightBackpack && rightInventory.id.includes(rightBackpack.name)) {
      targetPosition = 'right';
      console.log('[INTERCEPTOR] Container belongs to RIGHT backpack:', rightBackpack.name);
    }

    // Store the container data in the appropriate position
    if (targetPosition) {
      const containerData = {
        ...rightInventory,
        // Ensure we have a clean copy
        items: [...rightInventory.items]
      };

      if (targetPosition === 'left') {
        dispatch(setLeftBackpackData(containerData));
        console.log('[INTERCEPTOR] Stored container data for LEFT position');
      } else {
        dispatch(setRightBackpackData(containerData));
        console.log('[INTERCEPTOR] Stored container data for RIGHT position');
      }
    } else {
      console.log('[INTERCEPTOR] Could not determine target position for container');
    }

  }, [rightInventory, equippedBackpack, rightBackpack, dispatch]);

  // Clean up when backpacks are removed
  useEffect(() => {
    if (!equippedBackpack) {
      dispatch(clearBackpackData('left'));
      console.log('[INTERCEPTOR] Cleared LEFT backpack data');
      lastEquippedBackpackName.current = null;
    } else if (equippedBackpack.name !== lastEquippedBackpackName.current) {
      // NEW: Clear left backpack data when backpack changes (swapping)
      dispatch(clearBackpackData('left'));
      console.log('[INTERCEPTOR] Cleared LEFT backpack data due to backpack swap:', equippedBackpack.name);
      lastEquippedBackpackName.current = equippedBackpack.name;
    }
  }, [equippedBackpack, dispatch]);

  useEffect(() => {
    if (!rightBackpack) {
      dispatch(clearBackpackData('right'));
      console.log('[INTERCEPTOR] Cleared RIGHT backpack data');
    }
  }, [rightBackpack, dispatch]);
};