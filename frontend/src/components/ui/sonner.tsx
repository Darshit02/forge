import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useUIStore } from "../../stores/ui.store.js";

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useUIStore((s) => s.theme);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-paper group-[.toaster]:text-ink group-[.toaster]:border-hairline group-[.toaster]:shadow-none group-[.toaster]:rounded-md font-sans text-sm",
          description: "group-[.toast]:text-ash",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
