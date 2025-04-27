import { useState, useEffect, useRef, useCallback } from 'react';

interface AutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void> | void;
  interval?: number;
  debounce?: number;
  saveOnUnmount?: boolean;
  enabled?: boolean;
}

interface AutosaveResult {
  lastSaved: Date | null;
  isSaving: boolean;
  isError: boolean;
  errorMessage: string | null;
  triggerSave: () => Promise<void>;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

/**
 * A hook for automatically saving form data at regular intervals
 * 
 * @param options Configuration options for autosave
 * @returns Autosave state and control functions
 */
export function useAutosave<T>({
  data,
  onSave,
  interval = 30000, // Default: save every 30 seconds
  debounce = 1000,   // Default: debounce for 1 second
  saveOnUnmount = true,
  enabled = true,
}: AutosaveOptions<T>): AutosaveResult {
  const [state, setState] = useState({
    lastSaved: null as Date | null,
    isSaving: false,
    isError: false,
    errorMessage: null as string | null,
    saveStatus: 'idle' as 'idle' | 'saving' | 'saved' | 'error'
  });
  
  const dataRef = useRef(data);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const lastSavedDataRef = useRef(data);
  
  // Update the ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  
  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // The save function
  const save = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;
    
    // Skip if data hasn't changed
    if (JSON.stringify(dataRef.current) === JSON.stringify(lastSavedDataRef.current)) {
      return;
    }
    
    try {
      setState(prev => ({ ...prev, isSaving: true, saveStatus: 'saving' }));
      await onSave(dataRef.current);
      
      if (isMountedRef.current) {
        lastSavedDataRef.current = dataRef.current;
        setState(prev => ({
          ...prev,
          lastSaved: new Date(),
          isSaving: false,
          isError: false,
          errorMessage: null,
          saveStatus: 'saved'
        }));
        
        // Reset to idle after 3 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            setState(prev => ({ ...prev, saveStatus: 'idle' }));
          }
        }, 3000);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          isError: true,
          errorMessage: error instanceof Error ? error.message : 'An error occurred while saving',
          saveStatus: 'error'
        }));
      }
    }
  }, [enabled, onSave]);
  
  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      save();
    }, debounce);
  }, [save, debounce]);
  
  // Set up interval for autosave
  useEffect(() => {
    if (!enabled) return;
    
    intervalRef.current = setInterval(() => {
      save();
    }, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [save, interval, enabled]);
  
  // Set up effect for data changes
  useEffect(() => {
    if (!enabled) return;
    
    // Only trigger save if data has actually changed
    if (JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current)) {
      debouncedSave();
    }
  }, [data, debouncedSave, enabled]);
  
  // Save on unmount if enabled
  useEffect(() => {
    return () => {
      if (saveOnUnmount && enabled && isMountedRef.current) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        save();
      }
    };
  }, [save, saveOnUnmount, enabled]);
  
  return {
    lastSaved: state.lastSaved,
    isSaving: state.isSaving,
    isError: state.isError,
    errorMessage: state.errorMessage,
    saveStatus: state.saveStatus,
    triggerSave: save
  };
}

export default useAutosave;
