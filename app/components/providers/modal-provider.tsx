import { useSearchParams } from "@remix-run/react";
import React from "react";

interface ModalContextValues {
  open: boolean;
  setOpen: (value: boolean) => void;
  openModal: (name: string) => void;
  closeModal: () => void;
}

const ModalContext = React.createContext<ModalContextValues | undefined>(
  undefined
);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = React.useState(false);

  console.log(open);

  const openModal = (name: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("modal", name);
    setSearchParams(params, { preventScrollReset: true });
    setOpen(true);
  };

  const closeModal = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("modal");
    setSearchParams(params, { preventScrollReset: true });
    setOpen(false);
  };

  return (
    <ModalContext.Provider value={{ open, setOpen, openModal, closeModal }}>
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
