import React from "react";
import { Dialog, DialogClose, DialogContent } from "../ui/dialog";
import { useModal } from "../providers/modal-provider";
import { Cross1Icon, ChevronLeftIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "motion/react";

type ModalRouterProps = {
  param?: string;
  children: React.ReactNode;
};

type KeyedRoutes = Record<string, JSX.Element>;

const variants = {
  initial: (direction: "forward" | "back") => ({
    x: direction === "forward" ? 50 : -50,
    opacity: 0,
  }),
  enter: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: "forward" | "back") => ({
    x: direction === "forward" ? -50 : 50,
    opacity: 0,
  }),
};

export const ModalRouter: React.FC<ModalRouterProps> = ({ children }) => {
  const {
    open,
    setOpen,
    direction,
    canGoBack,
    goBack,
    currentModal,
    closeModal,
  } = useModal();
  const childProps =
    React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return;
      return child.props;
    }) || [];
  const keyedRoutes = childProps.reduce(
    (obj, item) => Object.assign(obj, { [item.path]: item.component }),
    {}
  ) as unknown as KeyedRoutes;

  const modalParam = currentModal || "";
  const Route = keyedRoutes[modalParam];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent onCloseAutoFocus={closeModal}>
        <div className="flex items-center justify-between px-4 sm:px-6 h-[var(--header-height)]">
          {canGoBack && (
            <button
              onClick={() => goBack()}
              className="rounded-full opacity-70 hover:opacity-100 transition-opacity outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          )}

          <DialogClose className="ml-auto opacity-70 hover:opacity-100 transition-opacity rounded-full">
            <Cross1Icon className="h-5 w-5" />
          </DialogClose>
        </div>
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={modalParam}
            variants={variants}
            custom={direction}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={{
              type: "spring",
              duration: 0.45,
            }}
            className="px-4 sm:px-6 pb-6 overflow-x-hidden overflow-y-auto flex-1"
          >
            {Route}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
