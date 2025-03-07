import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";

type LexicalEditorProps = {
  config: Parameters<typeof LexicalComposer>["0"]["initialConfig"];
};

function LexicalEditor({ config }: LexicalEditorProps) {
  return (
    <LexicalComposer initialConfig={config}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<Placeholder />}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalComposer>
  );
}

const Placeholder = () => {
  return (
    <div className="absolute top-[1.125rem] left-[1.125rem] opacity-50 z-50">
      Здесь должен быть текст...
    </div>
  );
};

const EDITOR_NAMESPACE = "lexical-editor";

export function Editor() {
  return (
    <div
      id={EDITOR_NAMESPACE}
      className="relative prose prose-zinc prose-p:my-0 prose-headings:mb-4 prose-headings:mt-2 max-w-full"
    >
      <LexicalEditor
        config={{
          namespace: EDITOR_NAMESPACE,
          theme: {
            root: "p-4 rounded-md h-full min-h-[200px] border border-input shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            link: "cursor-pointer",
            text: {
              bold: "font-semibold",
              underline: "underline",
              italic: "italic",
              strikethrough: "line-through",
              underlineStrikethrough: "underlined-line-through",
            },
          },
          onError: (error) => {
            console.log(error);
          },
        }}
      />
    </div>
  );
}
