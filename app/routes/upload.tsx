import {
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  unstable_createFileUploadHandler,
  unstable_composeUploadHandlers,
} from "@remix-run/node";
import type { NodeOnDiskFile, ActionFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await unstable_parseMultipartFormData(
    request,
    unstable_composeUploadHandlers(
      unstable_createFileUploadHandler({
        directory: "./public/media",
        avoidFileConflicts: true,
        file({ filename }) {
          return filename;
        },
        maxPartSize: 10 * 1024 * 1024,
      }),
      unstable_createMemoryUploadHandler()
    )
  );

  const files = formData.getAll("file") as NodeOnDiskFile[];

  return {
    files: files.map((file) => ({
      name: file.name,
      url: `/media/${file.name}`,
      type: file.type.startsWith("image") ? "IMAGE" : "MOVIE",
    })),
  };
};

export function useFileUpload(
  defaultValue: Array<{
    name: string;
    url: string;
    type: "IMAGE" | "MOVIE" | "OTHER";
  }> = []
) {
  const { submit, data, state, formData } = useFetcher<typeof action>();
  const isUploading = state !== "idle";

  const uploadingFiles = formData
    ?.getAll("file")
    .filter((value: unknown): value is File => value instanceof File)
    .map((file) => {
      const name = file.name;
      const type = file.type.startsWith("image") ? "IMAGE" : "MOVIE";

      const url = URL.createObjectURL(file);
      return { name, url, type };
    });

  const images = (data?.files ?? [])
    .concat(uploadingFiles ?? [])
    .concat(defaultValue);

  return {
    submit(files: FileList | null) {
      if (!files) return;

      const formData = new FormData();
      for (const file of files) formData.append("file", file);
      submit(formData, {
        method: "post",
        action: "/upload",
        encType: "multipart/form-data",
      });
    },
    isUploading,
    images,
  };
}

export default function Page() {
  return null;
}
