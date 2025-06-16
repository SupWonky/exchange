import React, { useEffect } from "react";

interface SidebarConetextValues {
  navigate: (to: string) => void;
  navigateBack: () => void;
  paths: string[];
}

export const SidebarContext = React.createContext<
  SidebarConetextValues | undefined
>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [paths, setPaths] = React.useState<string[]>([]);

  const navigate = (to: string) => {
    setPaths((prev) => [...prev, to]);
  };

  const navigateBack = () => {
    setPaths((prev) => prev.slice(0, paths.length - 1));
  };

  return (
    <SidebarContext.Provider value={{ navigate, navigateBack, paths }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be within a SidebarProvider");
  }
  return context;
}
