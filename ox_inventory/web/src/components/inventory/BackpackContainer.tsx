import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '../../store';
import { 
  selectEquippedBackpack, 
  selectOpenedRightBackpack,
  selectLeftBackpackData,
  selectRightBackpackData 
} from '../../store/inventory';
import InventoryGrid from './InventoryGrid';
import { Items } from '../../store/items';
import { fetchNui } from '../../utils/fetchNui';
import { getTotalWeight } from '../../helpers';

interface BackpackContainerProps {
  position: 'left' | 'right';
}

const BackpackContainer: React.FC<BackpackContainerProps> = ({ position }) => {
  const [isRequestingContainer, setIsRequestingContainer] = useState(false);
  const [requestAttempts, setRequestAttempts] = useState(0);

  // Get the active backpack for this position
  const equippedBackpack = useAppSelector(selectEquippedBackpack);
  const rightBackpack = useAppSelector(selectOpenedRightBackpack);
  const activeBackpack = position === 'left' ? equippedBackpack : rightBackpack;

  // NEW: Get independent container data instead of right inventory
  const leftBackpackData = useAppSelector(selectLeftBackpackData);
  const rightBackpackData = useAppSelector(selectRightBackpackData);
  const containerData = position === 'left' ? leftBackpackData : rightBackpackData;

  // Check if we have container data for this position
  const hasRealContainer = Boolean(activeBackpack && containerData);

  // FIXED: Calculate weight properly like InventoryGrid does
  const containerWeight = useMemo(() => {
    if (!containerData?.items) return 0;
    return Math.floor(getTotalWeight(containerData.items) * 1000) / 1000;
  }, [containerData?.items]);

  console.log(`[${position.toUpperCase()}] BackpackContainer render:`, {
    activeBackpack: activeBackpack?.name,
    hasContainerData: !!containerData,
    containerItems: containerData?.items?.length || 0
  });

  // Reset when backpack changes (including name changes for swapping)
  useEffect(() => {
    setRequestAttempts(0);
    setIsRequestingContainer(false);
    console.log(`[${position.toUpperCase()}] Backpack changed:`, activeBackpack?.name);
  }, [activeBackpack?.name, activeBackpack?.metadata?.container]);

  // Auto-request container if we don't have one OR if backpack changed
  useEffect(() => {
    if (activeBackpack && !hasRealContainer && !isRequestingContainer && requestAttempts === 0) {
      console.log(`[${position.toUpperCase()}] Auto-requesting container for:`, activeBackpack.name);
      const timer = setTimeout(() => {
        requestRealContainer();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [activeBackpack, hasRealContainer]);

  const requestRealContainer = async () => {
    if (!activeBackpack || isRequestingContainer) return;

    setIsRequestingContainer(true);
    setRequestAttempts(prev => prev + 1);

    try {
      console.log(`[${position.toUpperCase()}] Requesting container for:`, activeBackpack.name);
      
      await fetchNui('openBackpackContainer', {
        backpackItem: activeBackpack,
        isSlot6: position === 'left',
        position: position
      });

      console.log(`[${position.toUpperCase()}] Request sent successfully`);
      
    } catch (error) {
      console.error(`[${position.toUpperCase()}] Request failed:`, error);
    } finally {
      setTimeout(() => {
        setIsRequestingContainer(false);
      }, 3000);
    }
  };

  // Don't render if no active backpack
  if (!activeBackpack) {
    return null;
  }

  // Get backpack info
  const backpackItem = Items[activeBackpack.name];
  const backpackLabel = backpackItem?.label || activeBackpack.name;

  // Only render the InventoryGrid with maxRows and clean styling
  return (
    <div>
      {hasRealContainer && containerData ? (
        <InventoryGrid 
          inventory={containerData}
          maxRows={3}
          title={`${backpackLabel} [${position.toUpperCase()}]`}
        />
      ) : (
        // Minimal loading state that matches inventory styling
        <div className="inventory-grid-wrapper">
          <div className="inventory-grid-header-wrapper">
            <p>{backpackLabel} [{position.toUpperCase()}]</p>
            <div className="inventory-controls">
              {isRequestingContainer ? (
                <p style={{ fontSize: '12px', color: '#4299e1' }}>
                  Loading... ({requestAttempts}/3)
                </p>
              ) : (
                <button 
                  onClick={requestRealContainer}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    backgroundColor: 'transparent',
                    border: '1px solid #4299e1',
                    color: '#4299e1',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackpackContainer;