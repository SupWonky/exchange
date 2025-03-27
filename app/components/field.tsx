import React from "react";

export function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}

export function FieldError({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-destructive">{children}</div>;
}
