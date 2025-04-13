// This file will export the Tauri API functions we need
export async function selectFile() {
    try {
      // Try to use the Tauri API if available
      if (window.__TAURI__?.dialog?.open) {
        return await window.__TAURI__.dialog.open({
          multiple: false,
          filters: [{
            name: 'Text',
            extensions: ['txt']
          }]
        });
      } else {
        throw new Error("Tauri dialog API not available");
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      throw error;
    }
  }
  
  export async function selectDirectory() {
    try {
      if (window.__TAURI__?.dialog?.open) {
        return await window.__TAURI__.dialog.open({
          directory: true,
          multiple: false
        });
      } else {
        throw new Error("Tauri dialog API not available");
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
      throw error;
    }
  }
  
  export async function readTextFile(path) {
    try {
      if (window.__TAURI__?.fs?.readTextFile) {
        return await window.__TAURI__.fs.readTextFile(path);
      } else {
        throw new Error("Tauri fs API not available");
      }
    } catch (error) {
      console.error("Error reading file:", error);
      throw error;
    }
  }
  
  export async function writeTextFile(path, content) {
    try {
      if (window.__TAURI__?.fs?.writeTextFile) {
        return await window.__TAURI__.fs.writeTextFile(path, content);
      } else {
        throw new Error("Tauri fs API not available");
      }
    } catch (error) {
      console.error("Error writing file:", error);
      throw error;
    }
  }
  
  export async function joinPaths(base, ...parts) {
    try {
      if (window.__TAURI__?.path?.join) {
        return await window.__TAURI__.path.join(base, ...parts);
      } else {
        // Simple fallback if Tauri API not available
        return [base, ...parts].join('/').replace(/\/+/g, '/');
      }
    } catch (error) {
      console.error("Error joining paths:", error);
      throw error;
    }
  }
  
  export async function getBasename(path) {
    try {
      if (window.__TAURI__?.path?.basename) {
        return await window.__TAURI__.path.basename(path);
      } else {
        // Simple fallback
        return path.split('/').pop();
      }
    } catch (error) {
      console.error("Error getting basename:", error);
      throw error;
    }
  }
  
  // Check if Tauri API is available
  export function isTauriAvailable() {
    return Boolean(window.__TAURI__);
  }

  export function saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Error saving to storage:", error);
      return false;
    }
  }
  
  export function getFromStorage(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Error getting from storage:", error);
      return null;
    }
  }