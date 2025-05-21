import { useState } from "react";
import { parseFileType } from "~/lib/utils";

type AttachmentType = "IMAGE" | "MOVIE" | "OTHER";

export interface Attachment {
  type: AttachmentType;
  url: string;
  name?: string;
  file?: File;
}

const MAX_ATTACHMENTS = 5;

export function useAttachments(
  defualtValue?: Attachment[],
  max = MAX_ATTACHMENTS
) {
  const [attachments, setAttachments] = useState<Attachment[]>(
    defualtValue || []
  );

  const add = (files: Attachment[]) => {
    setAttachments((prev) => [...prev, ...files]);
  };

  const remove = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const reset = () => {
    setAttachments([]);
  };

  return { attachments, add, remove, reset };
}
