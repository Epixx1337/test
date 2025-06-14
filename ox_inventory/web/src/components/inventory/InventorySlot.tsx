import React, { useCallback, useRef } from 'react';
import { DragSource, Inventory, InventoryType, Slot, SlotWithItem } from '../../typings';
import { useDrag, useDragDropManager, useDrop } from 'react-dnd';
import { useAppDispatch } from '../../store';
import WeightBar from '../utils/WeightBar';
import { onDrop } from '../../dnd/onDrop';
import { onBuy } from '../../dnd/onBuy';
import { Items } from '../../store/items';
import { canCraftItem, canPurchaseItem, getItemUrl, isSlotWithItem } from '../../helpers';
import { onUse } from '../../dnd/onUse';
import { Locale } from '../../store/locale';
import { onCraft } from '../../dnd/onCraft';
import useNuiEvent from '../../hooks/useNuiEvent';
import { ItemsPayload } from '../../reducers/refreshSlots';
import { closeTooltip, openTooltip } from '../../store/tooltip';
import { openContextMenu } from '../../store/contextMenu';
import { useMergeRefs } from '@floating-ui/react';
import { imagepath } from '../../store/imagepath';

interface SlotProps {
  inventoryId: Inventory['id'];
  inventoryType: Inventory['type'];
  inventoryGroups: Inventory['groups'];
  item: Slot;
}

// Function to get placeholder image URL using the same imagepath system
const getPlaceholderImage = (slot: number): string => {
  switch (slot) {
    case 1:
    case 2:
      return `${imagepath}/placeholder_weapon.png`;
    case 6:
      return `${imagepath}/placeholder_backpack.png`;
    case 7:
      return `${imagepath}/placeholder_parachute.png`;
    case 8:
      return `${imagepath}/placeholder_armour.png`;
    case 9:
      return `${imagepath}/placeholder_phone.png`;
    default:
      return '';
  }
};

// Validation functions for slot restrictions
const isValidItemForSlot = (item: SlotWithItem, slot: number): boolean => {
  const itemName = item.name.toLowerCase();
  
  switch (slot) {
    case 1:
    case 2:
      // Only weapons - check multiple ways:
      // 1. Check if item has weapon property set to true (both original and uppercase)
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

const InventorySlot: React.ForwardRefRenderFunction<HTMLDivElement, SlotProps> = (
  { item, inventoryId, inventoryType, inventoryGroups },
  ref
) => {
  const manager = useDragDropManager();
  const dispatch = useAppDispatch();
  const timerRef = useRef<number | null>(null);

  const canDrag = useCallback(() => {
    return canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) && canCraftItem(item, inventoryType);
  }, [item, inventoryType, inventoryGroups]);

  const [{ isDragging }, drag] = useDrag<DragSource, void, { isDragging: boolean }>(
    () => ({
      type: 'SLOT',
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      item: () =>
        isSlotWithItem(item, inventoryType !== InventoryType.SHOP)
          ? {
              inventory: inventoryType,
              item: {
                name: item.name,
                slot: item.slot,
              },
              image: item?.name && `url(${getItemUrl(item) || 'none'}`,
            }
          : null,
      canDrag,
    }),
    [inventoryType, item]
  );

  const [{ isOver }, drop] = useDrop<DragSource, void, { isOver: boolean }>(
    () => ({
      accept: 'SLOT',
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
      drop: (source) => {
        dispatch(closeTooltip());
        
        // Check slot restrictions for action bar slots
        if (inventoryType === 'player' && item.slot <= 9 && source.item) {
          const sourceItem = source.item as SlotWithItem;
          if (!isValidItemForSlot(sourceItem, item.slot)) {
            return;
          }
        }
        
        switch (source.inventory) {
          case InventoryType.SHOP:
            onBuy(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
          case InventoryType.CRAFTING:
            onCraft(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
          default:
            // Use the standard onDrop - ox_inventory handles different inventory types automatically
            onDrop(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
        }
      },
      canDrop: (source) => {
        const basicCanDrop = (source.item.slot !== item.slot || source.inventory !== inventoryType) &&
          inventoryType !== InventoryType.SHOP &&
          inventoryType !== InventoryType.CRAFTING;
        
        // Additional check for action bar slot restrictions
        if (basicCanDrop && inventoryType === 'player' && item.slot <= 9 && source.item) {
          const sourceItem = source.item as SlotWithItem;
          return isValidItemForSlot(sourceItem, item.slot);
        }
        
        return basicCanDrop;
      },
    }),
    [inventoryType, item, inventoryId]
  );

  useNuiEvent('refreshSlots', (data: { items?: ItemsPayload | ItemsPayload[] }) => {
    if (!isDragging && !data.items) return;
    if (!Array.isArray(data.items)) return;

    const itemSlot = data.items.find(
      (dataItem) => dataItem.item.slot === item.slot && dataItem.inventory === inventoryId
    );

    if (!itemSlot) return;

    manager.dispatch({ type: 'dnd-core/END_DRAG' });
  });

  const connectRef = (element: HTMLDivElement) => drag(drop(element));

  const handleContext = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (inventoryType !== 'player' || !isSlotWithItem(item)) return;

    dispatch(openContextMenu({ item, coords: { x: event.clientX, y: event.clientY } }));
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(closeTooltip());
    if (timerRef.current) clearTimeout(timerRef.current);
    if (event.ctrlKey && isSlotWithItem(item) && inventoryType !== 'shop' && inventoryType !== 'crafting') {
      onDrop({ item: item, inventory: inventoryType });
    } else if (event.altKey && isSlotWithItem(item) && inventoryType === 'player') {
      onUse(item);
    }
  };

  const refs = useMergeRefs([connectRef, ref]);

  // Determine background image - only for items, not placeholders
  const getBackgroundImage = () => {
    if (item?.name && isSlotWithItem(item)) {
      return `url(${getItemUrl(item as SlotWithItem) || 'none'}`;
    }
    return 'none';
  };

  return (
    <div
      ref={refs}
      onContextMenu={handleContext}
      onClick={handleClick}
      className={`inventory-slot ${inventoryType === 'player' && item.slot <= 9 ? `hotbar-slot slot-${item.slot}` : ''}`}
      style={{
        filter:
          !canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) || !canCraftItem(item, inventoryType)
            ? 'brightness(80%) grayscale(100%)'
            : undefined,
        opacity: isDragging ? 0.4 : 1.0,
        backgroundImage: getBackgroundImage(),
        border: isOver ? '1px dashed rgba(255,255,255,0.4)' : '',
      }}
    >
      {/* Placeholder overlay for empty action bar slots */}
      {inventoryType === 'player' && item.slot <= 9 && !isSlotWithItem(item) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${getPlaceholderImage(item.slot)})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: '60%',
            opacity: 0.3,
            pointerEvents: 'none',
          }}
        />
      )}
      
      {isSlotWithItem(item) && (
        <div
          className="item-slot-wrapper"
          onMouseEnter={() => {
            timerRef.current = window.setTimeout(() => {
              dispatch(openTooltip({ item, inventoryType }));
            }, 500) as unknown as number;
          }}
          onMouseLeave={() => {
            dispatch(closeTooltip());
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }}
        >
          <div
            className={
              // Show hotbar styling for slots 1-9 in player inventory (both in main inventory and hotbar)
              inventoryType === 'player' && item.slot <= 9 ? 'item-hotslot-header-wrapper' : 'item-slot-header-wrapper'
            }
          >
            {/* Show slot number ONLY for slots 1-5 in player inventory (keybindable slots) */}
            {inventoryType === 'player' && item.slot <= 5 && <div className="inventory-slot-number">{item.slot}</div>}
            <div className="item-slot-info-wrapper">
              <p>
                {item.weight > 0
                  ? item.weight >= 1000
                    ? `${(item.weight / 1000).toLocaleString('en-us', {
                        minimumFractionDigits: 2,
                      })}kg `
                    : `${item.weight.toLocaleString('en-us', {
                        minimumFractionDigits: 0,
                      })}g `
                  : ''}
              </p>
              <p>{item.count ? item.count.toLocaleString('en-us') + `x` : ''}</p>
            </div>
          </div>
          <div>
            {inventoryType !== 'shop' && item?.durability !== undefined && (
              <WeightBar percent={item.durability} durability />
            )}
            {inventoryType === 'shop' && item?.price !== undefined && (
              <>
                {item?.currency !== 'money' && item.currency !== 'black_money' && item.price > 0 && item.currency ? (
                  <div className="item-slot-currency-wrapper">
                    <img
                      src={item.currency ? getItemUrl(item.currency) : 'none'}
                      alt="item-image"
                      style={{
                        imageRendering: '-webkit-optimize-contrast',
                        height: 'auto',
                        width: '2vh',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                      }}
                    />
                    <p>{item.price.toLocaleString('en-us')}</p>
                  </div>
                ) : (
                  <>
                    {item.price > 0 && (
                      <div
                        className="item-slot-price-wrapper"
                        style={{ color: item.currency === 'money' || !item.currency ? '#2ECC71' : '#E74C3C' }}
                      >
                        <p>${item.price.toLocaleString('en-us')}</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            <div className="inventory-slot-label-box">
              <div className="inventory-slot-label-text">
                {item.metadata?.label ? item.metadata.label : Items[item.name]?.label || item.name}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.forwardRef(InventorySlot);