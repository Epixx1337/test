import { onUse } from '../../dnd/onUse';
import { onGive } from '../../dnd/onGive';
import { onDrop } from '../../dnd/onDrop';
import { Items } from '../../store/items';
import { fetchNui } from '../../utils/fetchNui';
import { Locale } from '../../store/locale';
import { isSlotWithItem } from '../../helpers';
import { setClipboard } from '../../utils/setClipboard';
import { useAppSelector, useAppDispatch } from '../../store';
import { openRightBackpack, closeRightBackpack } from '../../store/inventory';
import { SlotWithItem } from '../../typings';
import React from 'react';
import { Menu, MenuItem } from '../utils/menu/Menu';

interface DataProps {
  action: string;
  component?: string;
  slot?: number;
  serial?: string;
  id?: number;
}

interface Button {
  label: string;
  index: number;
  group?: string;
}

interface Group {
  groupName: string | null;
  buttons: ButtonWithIndex[];
}

interface ButtonWithIndex extends Button {
  index: number;
}

interface GroupedButtons extends Array<Group> {}

const InventoryContext: React.FC = () => {
  const contextMenu = useAppSelector((state) => state.contextMenu);
  const dispatch = useAppDispatch();
  const item = contextMenu.item;

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

  const handleClick = async (data: DataProps) => {
    if (!item) return;

    switch (data && data.action) {
      case 'use':
        onUse({ name: item.name, slot: item.slot });
        break;
      case 'give':
        onGive({ name: item.name, slot: item.slot });
        break;
      case 'drop':
        isSlotWithItem(item) && onDrop({ item: item, inventory: 'player' });
        break;
      case 'open_backpack':
        if (isSlotWithItem(item) && isBackpack(item.name)) {
          try {
            console.log('Opening real backpack container via context menu:', item.name);
            
            // First, update Redux state to show the backpack in UI
            dispatch(openRightBackpack(item));
            
            // Then request the real container from server
            await fetchNui('openBackpackContainer', { 
              backpackItem: item,
              isSlot6: false, // This is a right-click opened backpack
              position: 'right'
            });

            console.log('Real backpack container request sent successfully');
          } catch (error) {
            console.error('Error opening real backpack container:', error);
            // Keep the UI backpack open - BackpackContainer will handle showing the error/retry
          }
        }
        break;
      case 'close_backpack':
        dispatch(closeRightBackpack());
        
        // Also notify server to close the real container
        fetchNui('closeBackpackContainer', {
          backpackName: item?.name
        }).catch(() => {
          console.log('Server close notification failed (not critical)');
        });
        break;
      case 'remove':
        fetchNui('removeComponent', { component: data?.component, slot: data?.slot });
        break;
      case 'removeAmmo':
        fetchNui('removeAmmo', item.slot);
        break;
      case 'copy':
        setClipboard(data.serial || '');
        break;
      case 'custom':
        fetchNui('useButton', { id: (data?.id || 0) + 1, slot: item.slot });
        break;
    }
  };

  const groupButtons = (buttons: any): GroupedButtons => {
    return buttons.reduce((groups: Group[], button: Button, index: number) => {
      if (button.group) {
        const groupIndex = groups.findIndex((group) => group.groupName === button.group);
        if (groupIndex !== -1) {
          groups[groupIndex].buttons.push({ ...button, index });
        } else {
          groups.push({
            groupName: button.group,
            buttons: [{ ...button, index }],
          });
        }
      } else {
        groups.push({
          groupName: null,
          buttons: [{ ...button, index }],
        });
      }
      return groups;
    }, []);
  };

  // Check if current item is a backpack
  const isCurrentItemBackpack = item && isSlotWithItem(item) && isBackpack(item.name);

  return (
    <>
      <Menu>
        <MenuItem onClick={() => handleClick({ action: 'use' })} label={Locale.ui_use || 'Use'} />
        <MenuItem onClick={() => handleClick({ action: 'give' })} label={Locale.ui_give || 'Give'} />
        <MenuItem onClick={() => handleClick({ action: 'drop' })} label={Locale.ui_drop || 'Drop'} />
        
        {/* Enhanced backpack-specific options */}
        {isCurrentItemBackpack && (
          <MenuItem 
            onClick={() => handleClick({ action: 'open_backpack' })} 
            label="🎒 Open Backpack (Real Container)" 
          />
        )}
        
        {item && item.metadata?.ammo && item.metadata.ammo > 0 && (
          <MenuItem onClick={() => handleClick({ action: 'removeAmmo' })} label={Locale.ui_remove_ammo} />
        )}
        {item && item.metadata?.serial && (
          <MenuItem
            onClick={() => handleClick({ action: 'copy', serial: item.metadata?.serial })}
            label={Locale.ui_copy}
          />
        )}
        {item && item.metadata?.components && item.metadata?.components.length > 0 && (
          <Menu label={Locale.ui_removeattachments}>
            {item &&
              item.metadata?.components.map((component: string, index: number) => (
                <MenuItem
                  key={index}
                  onClick={() => handleClick({ action: 'remove', component, slot: item.slot })}
                  label={Items[component]?.label || ''}
                />
              ))}
          </Menu>
        )}
        {((item && item.name && Items[item.name]?.buttons?.length) || 0) > 0 && (
          <>
            {item &&
              item.name &&
              groupButtons(Items[item.name]?.buttons).map((group: Group, index: number) => (
                <React.Fragment key={index}>
                  {group.groupName ? (
                    <Menu label={group.groupName}>
                      {group.buttons.map((button: Button) => (
                        <MenuItem
                          key={button.index}
                          onClick={() => handleClick({ action: 'custom', id: button.index })}
                          label={button.label}
                        />
                      ))}
                    </Menu>
                  ) : (
                    group.buttons.map((button: Button) => (
                      <MenuItem
                        key={button.index}
                        onClick={() => handleClick({ action: 'custom', id: button.index })}
                        label={button.label}
                      />
                    ))
                  )}
                </React.Fragment>
              ))}
          </>
        )}
      </Menu>
    </>
  );
};

export default InventoryContext;