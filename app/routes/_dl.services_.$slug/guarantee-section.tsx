import { Shield } from "lucide-react";
import React from "react";
import { siteConfig } from "~/config/site";

export function GuaranteeSection() {
  const [expanded, setExpanded] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
  };

  React.useEffect(() => {
    if (contentRef.current) {
      // Measure and set content height once on mount
      const height = contentRef.current.scrollHeight;
      contentRef.current.style.setProperty("--content-height", `${height}px`);
    }
  }, []);

  return (
    <div className="bg-card border md:rounded-lg mb-6 p-4">
      <div className="flex">
        <div className="mr-3">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
            <Shield className="h-8 w-8 text-indigo-900" />
          </div>
        </div>
        <div>
          <h3 className="font-medium">Гарантия возврата</h3>
          <p className="text-sm text-muted-foreground">
            Средства моментально вернутся на счет, если что-то пойдет не так
          </p>
          <button
            onClick={toggleExpanded}
            className="text-indigo-500 text-sm border-b border-indigo-500 border-dashed"
          >
            Как это работает?
          </button>
        </div>
      </div>

      <div
        className={`mt-2.5 text-sm overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up`}
        data-state={expanded ? "open" : "closed"}
        ref={contentRef}
        style={{ overflow: "hidden" }}
      >
        <p>
          {siteConfig.name} переводит деньги продавцу, только когда покупатель
          проверил и принял заказ.
        </p>
        <div className="font-semibold my-2.5">Деньги можно вернуть:</div>
        <ul className="list-outside list-disc">
          <li className="my-1 ml-3">
            Моментально, если заказ отменяется покупателем в первые 20 мин.
            после старта
          </li>
          <li className="my-1 ml-3">
            Моментально, если продавец просрочил заказ, и покупатель решил
            отменить его
          </li>
          <li className="my-1 ml-3">
            Моментально, если продавец и покупатель согласовали отмену заказа
          </li>
          <li className="my-1 ml-3">
            В течение нескольких часов, если заказ выполнен некачественно или не
            полностью
          </li>
        </ul>
      </div>
    </div>
  );
}
