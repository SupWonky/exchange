import { useSearchParams } from "@remix-run/react";
import React from "react";

type Direction = "back" | "forward";

interface ModalContextValues {
  open: boolean;
  setOpen: (open: boolean) => void;
  setModal: (name: string) => void;
  closeModal: () => void;
  direction?: Direction;
  canGoBack: boolean;
  goBack: () => void;
}

const ModalContext = React.createContext<ModalContextValues | undefined>(
  undefined
);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = React.useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [direction, setDirection] = React.useState<Direction>();

  const currentModal = searchParams.get("modal");
  const [open, setOpen] = React.useState(Boolean(currentModal));
  const canGoBack = history.length > 1;

  React.useEffect(() => {
    if (currentModal) {
      setOpen(true);
    } else {
      setHistory([]);
      setOpen(false);
    }
  }, [currentModal]);

  const setModal = React.useCallback(
    (name: string) => {
      const params = new URLSearchParams(searchParams);
      params.set("modal", name);
      setSearchParams(params, { preventScrollReset: true });
      setHistory((prev) => [...prev, name]);
      setDirection("forward");
    },
    [searchParams, setSearchParams]
  );

  const closeModal = React.useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete("modal");
    setSearchParams(params, { preventScrollReset: true });
  }, [searchParams, setSearchParams]);

  const goBack = React.useCallback(() => {
    if (history.length <= 1) return;

    const newHistory = history.slice(0, -1);
    const prevModal = newHistory[newHistory.length - 1];

    const params = new URLSearchParams(searchParams);
    if (prevModal) {
      params.set("modal", prevModal);
    } else {
      params.delete("modal");
    }
    setSearchParams(params, { preventScrollReset: true });

    setHistory(newHistory);
    setDirection("back");
  }, [history, searchParams, setSearchParams]);

  return (
    <ModalContext.Provider
      value={{
        open,
        setOpen,
        setModal,
        closeModal,
        canGoBack,
        goBack,
        direction,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
