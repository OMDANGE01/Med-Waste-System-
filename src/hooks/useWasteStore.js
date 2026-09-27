import { useWasteContext } from '../context/WasteContext';

/**
 * Convenient selector hook to interact with state in any component
 */
export function useWasteStore() {
  return useWasteContext();
}

export default useWasteStore;
