import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-paper group-[.toaster]:text-ink group-[.toaster]:border-hairline group-[.toaster]:shadow-none group-[.toaster]:rounded-2xl font-sans text-xs font-normal p-4",
          description: "group-[.toast]:text-ash font-normal text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-ink group-[.toast]:rounded-[6px] font-normal text-xs px-3 py-1",
          cancelButton:
            "group-[.toast]:bg-bone group-[.toast]:text-ink group-[.toast]:rounded-[6px] font-normal text-xs px-3 py-1",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
