import { useSearchParams } from "@remix-run/react";
import React from "react";
import { Dialog, DialogClose, DialogContent } from "../ui/dialog";
import { useModal } from "../providers/modal-provider";
import { Cross1Icon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "motion/react";

type ModalRouterProps = {
  param?: string;
  children: React.ReactNode;
};

type KeyedRoutes = Record<string, JSX.Element>;

export const ModalRouter: React.FC<ModalRouterProps> = ({
  children,
  param = "modal",
}) => {
  const { open, setOpen } = useModal();
  const childProps =
    React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return;
      return child.props;
    }) || [];
  const keyedRoutes = childProps.reduce(
    (obj, item) => Object.assign(obj, { [item.path]: item.component }),
    {}
  ) as unknown as KeyedRoutes;

  const [searchParams, setSearchParams] = useSearchParams();
  const modalParam = searchParams.get(param) || "";
  const Route = keyedRoutes[modalParam];

  const onClose = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("modal");
    setSearchParams(params);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg" onCloseAutoFocus={onClose}>
        <div className="flex items-center h-16 px-6">
          <DialogClose className="ml-auto opacity-70 hover:opacity-100 transition-opacity">
            <Cross1Icon className="h-5 w-5" />
          </DialogClose>
        </div>
        <div className="px-6 pb-6 overflow-x-hidden overflow-y-auto">
          <AnimatePresence mode="wait">
            {modalParam && (
              <motion.div
                key={modalParam}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
              >
                {Route}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
