interface IElectronAPI {
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    electron: IElectronAPI;
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

export {}; 