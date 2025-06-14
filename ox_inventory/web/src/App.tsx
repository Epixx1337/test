import InventoryComponent from './components/inventory';
import useNuiEvent from './hooks/useNuiEvent';
import { Items } from './store/items';
import { Locale } from './store/locale';
import { setImagePath } from './store/imagepath';
import { setupInventory, addBackpackInventory, removeBackpackInventory, updateBackpackInventory } from './store/inventory';
import { Inventory } from './typings';
import { useAppDispatch } from './store';
import DragPreview from './components/utils/DragPreview';
import { fetchNui } from './utils/fetchNui';
import { useDragDropManager } from 'react-dnd';
import KeyPress from './components/utils/KeyPress';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const manager = useDragDropManager();

  useNuiEvent<{
    locale: { [key: string]: string };
    items: typeof Items;
    leftInventory: Inventory;
    imagepath: string;
  }>('init', ({ locale, items, leftInventory, imagepath }) => {
    for (const name in locale) Locale[name] = locale[name];
    for (const name in items) Items[name] = items[name];

    setImagePath(imagepath);
    dispatch(setupInventory({ leftInventory }));
  });

  // Handle backpack stash equipped - receive full inventory data from server
  useNuiEvent<{
    slot: number;
    stashId: string;
    inventory: Inventory;
  }>('addBackpackStash', (data) => {
    dispatch(addBackpackInventory({
      slot: data.slot,
      inventory: data.inventory,
      container: data.stashId,
    }));
  });

  // Handle backpack stash removed
  useNuiEvent<{
    slot: number;
  }>('removeBackpackStash', (data) => {
    dispatch(removeBackpackInventory(data.slot));
  });

  // Handle backpack inventory updates
  useNuiEvent<{
    container: string;
    inventory: Inventory;
  }>('updateBackpackInventory', ({ container, inventory }) => {
    dispatch(updateBackpackInventory({ container, inventory }));
  });

  fetchNui('uiLoaded', {});

  useNuiEvent('closeInventory', () => {
    manager.dispatch({ type: 'dnd-core/END_DRAG' });
  });

  return (
    <div className="app-wrapper">
      <InventoryComponent />
      <DragPreview />
      <KeyPress />
    </div>
  );
};

addEventListener("dragstart", function(event) {
  event.preventDefault()
})

export default App;