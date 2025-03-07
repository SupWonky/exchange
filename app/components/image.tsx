import * as React from "react";

export interface ImageProps extends React.HTMLAttributes<HTMLImageElement> {
  name: string;
  url: string;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ name, url, ...props }, ref) => {
    const [objectUrl] = React.useState(() => {
      if (url.startsWith("blob:")) return url;
      return undefined;
    });

    React.useEffect(() => {
      // If there's an objectUrl but the `url` is not a blob anymore, we revoke it
      if (objectUrl && !url.startsWith("blob:")) URL.revokeObjectURL(objectUrl);
    }, [objectUrl, url]);

    return (
      <img
        ref={ref}
        alt={name}
        src={url}
        style={{
          // Some styles, here we apply a blur filter when it's being uploaded
          transition: "filter 300ms ease",
          filter: url.startsWith("blob:") ? "blur(4px)" : "blur(0)",
        }}
        {...props}
      />
    );
  }
);

Image.displayName = "Image";

export { Image };
