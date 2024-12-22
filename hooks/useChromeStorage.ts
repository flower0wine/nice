import { useEffect, useState, useSyncExternalStore } from "react";

interface UseChromeStorageOptions<T> {
  defaultValue?: T;

  // 是否使用 sync storage 而不是 local storage
  sync?: boolean;
}

export function useChromeStorage<T>(
  key: string,
  options: UseChromeStorageOptions<T> = {}
): [T, (value: T) => Promise<void>] {
  const { defaultValue = null as T, sync = false } = options;
  const storage = sync ? chrome.storage.sync : chrome.storage.local;
  const [data, setData] = useState<T | null>(defaultValue);

  useEffect(() => {
    storage
      .get(key)
      .then((result) => {
        setData(result[key] ?? defaultValue);
      })
      .catch((error) => {
        console.error("Error retrieving data from storage:", error);
      });
  }, []);

  const getSnapshot = () => {
    return data ?? defaultValue;
  };

  const subscribe = (callback: () => void) => {
    const handleStorageChange = () => {
      storage
        .get(key)
        .then((result) => {
          setData(result[key] ?? defaultValue);
          callback();
        })
        .catch((error) => {
          console.error("Error retrieving data from storage on change:", error);
        });
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  };

  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => defaultValue
  );

  const setValue = async (newValue: T) => {
    try {
      await storage.set({ [key]: newValue });
    } catch (error) {
      console.error("Error saving data to storage:", error);
    }
  };

  return [value, setValue];
}
