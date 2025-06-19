import { useLocation } from "@remix-run/react";
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
  currentModal: string | null;
}

const ModalContext = React.createContext<ModalContextValues | undefined>(
  undefined
);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [history, setHistory] = React.useState<string[]>([]);
  const [direction, setDirection] = React.useState<Direction>();

  const [currentModal, setCurrentModal] = React.useState<string | null>(
    location.hash
  );
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

  const setModal = React.useCallback((name: string) => {
    setCurrentModal(name);
    setHistory((prev) => [...prev, name]);
    setDirection("forward");

    window.location.hash = name;
  }, []);

  const closeModal = React.useCallback(() => {
    setCurrentModal(null);
    window.location.hash = "";
  }, []);

  const goBack = React.useCallback(() => {
    if (history.length <= 1) return;

    const newHistory = history.slice(0, -1);
    const prevModal = newHistory[newHistory.length - 1];

    setCurrentModal(prevModal);
    window.location.hash = prevModal;

    setHistory(newHistory);
    setDirection("back");
  }, [history]);

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
        currentModal,
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
