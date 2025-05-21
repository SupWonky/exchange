import { FieldName } from "@conform-to/react";
import { ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAttachments } from "~/hooks/use-attachments";
import { useFileUpload } from "~/routes/upload";

export interface Attachment {
  type: "IMAGE" | "MOVIE" | "OTHER";
  url: string;
  title?: string;
  file?: File;
}

const MAX_ATTACHMENTS = 5;

const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

type MediaUploadProps = {
  name: FieldName<any>;
  defualtValue?: Attachment[];
};

export function MediaUpload({ name, defualtValue }: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files, submit } = useFileUpload();
  const { attachments, add, remove } = useAttachments(
    defualtValue,
    MAX_ATTACHMENTS
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = e.target.files;
    if (!newFiles || newFiles.length === 0) return;

    // if (files.length > availableSlots) {
    //   toast.warning(
    //     `Можно загрузить только ${availableSlots} из ${files.length} выбранных файлов`
    //   );
    //   return
    // }

    submit(newFiles);

    // Reset the input so that the same file can be selected again if needed
    e.target.value = "";
  }

  useEffect(() => {
    add(files);
  }, [files]);

  return (
    <div>
      {/* Status Message */}
      <div className="mb-2">
        <p className="text-sm text-muted-foreground">
          {attachments.length} из {MAX_ATTACHMENTS} файлов добавлено
        </p>
      </div>

      {/* Drag-and-Drop / Click Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (fileInputRef.current) {
            const dataTransfer = e.dataTransfer;
            if (dataTransfer && dataTransfer.files) {
              // Create a fake event object to reuse handleFileChange
              const event = {
                target: { files: dataTransfer.files, value: "" },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleFileChange(event);
            }
          }
        }}
        onKeyDown={(e) => {
          e.preventDefault();
          if (e.key === "Enter") {
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        className="border-dashed border-2 border-muted rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
      >
        <p className="mb-2 text-sm text-muted-foreground">
          Перетащите файлы сюда или нажмите для выбора
        </p>
        <button
          type="button"
          disabled={attachments.length >= MAX_ATTACHMENTS}
          className="inline-flex items-center gap-2 p-2 border border-transparent rounded bg-muted hover:bg-muted/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Добавить файлы"
        >
          <ImageIcon className="w-5 h-5" />
          <span>Добавить файлы</span>
        </button>
      </div>

      {/* Thumbnails Preview */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {attachments.map((attachment, idx) => (
            <div
              key={idx}
              className="relative group aspect-square bg-muted rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary"
            >
              {attachment.type === "IMAGE" ? (
                <img
                  src={attachment.url}
                  className="w-full h-full object-cover"
                  alt={attachment.name || "Изображение"}
                />
              ) : (
                <video
                  controls
                  className="w-full h-full object-cover"
                  src={attachment.url}
                  muted
                />
              )}
              <button
                onClick={() => remove(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                aria-label={`Удалить ${attachment.name || "файл"}`}
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        accept={allowedTypes.join(",")}
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        disabled={attachments.length >= MAX_ATTACHMENTS}
      />
      <input
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        type="text"
        name={name}
        value={JSON.stringify(attachments)}
        readOnly
      />
    </div>
  );
}
