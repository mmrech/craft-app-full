import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // File dialog operations
  openPDF: () => ipcRenderer.invoke('dialog:openPDF'),
  
  saveFile: (data: {
    content: string;
    defaultName: string;
    filterName: string;
    extensions: string[];
  }) => ipcRenderer.invoke('dialog:saveFile', data),
  
  // File system operations (limited for security)
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // Environment detection
  isElectron: true,
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electron: {
      openPDF: () => Promise<{
        name: string;
        path: string;
        data: string;
        size: number;
      } | null>;
      saveFile: (data: {
        content: string;
        defaultName: string;
        filterName: string;
        extensions: string[];
      }) => Promise<{ success: boolean; path?: string; error?: string }>;
      readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      getVersion: () => Promise<string>;
      isElectron: boolean;
    };
  }
}
