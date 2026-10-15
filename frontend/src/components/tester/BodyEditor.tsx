import { useState } from "react";
import { Check, AlertCircle } from "lucide-react";

interface BodyEditorProps {
  body: string;
  bodyType: "json" | "raw" | "form";
  onChange: (body: string) => void;
  onTypeChange: (type: "json" | "raw" | "form") => void;
}

export function BodyEditor({
  body,
  bodyType,
  onChange,
  onTypeChange,
}: BodyEditorProps) {
  const [isValidJson, setIsValidJson] = useState(true);

  const handleBodyChange = (val: string) => {
    onChange(val);
    if (bodyType === "json" && val.trim()) {
      try {
        JSON.parse(val);
        setIsValidJson(true);
      } catch {
        setIsValidJson(false);
      }
    } else {
      setIsValidJson(true);
    }
  };

  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(body);
      onChange(JSON.stringify(parsed, null, 2));
      setIsValidJson(true);
    } catch {
      // not valid JSON
    }
  };

  return (
    <div className="flex flex-col h-full p-3 font-sans text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-hairline mb-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-ash hover:text-ink dark:hover:text-paper">
            <input
              type="radio"
              name="bodyType"
              checked={bodyType === "json"}
              onChange={() => onTypeChange("json")}
              className="accent-primary"
            />
            <span>JSON</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-ash hover:text-ink dark:hover:text-paper">
            <input
              type="radio"
              name="bodyType"
              checked={bodyType === "raw"}
              onChange={() => onTypeChange("raw")}
              className="accent-primary"
            />
            <span>Raw text</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          {bodyType === "json" && (
            <>
              {isValidJson ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3 h-3" /> Valid JSON
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-destructive">
                  <AlertCircle className="w-3 h-3" /> Invalid JSON
                </span>
              )}
              <button
                onClick={handlePrettify}
                className="text-[10px] text-ash hover:text-ink dark:hover:text-paper underline"
              >
                Prettify
              </button>
            </>
          )}
        </div>
      </div>

      <textarea
        value={body}
        onChange={(e) => handleBodyChange(e.target.value)}
        placeholder='{\n  "key": "value"\n}'
        className="flex-1 w-full min-h-[140px] p-2 rounded-md border border-hairline bg-paper dark:bg-card font-mono text-xs text-ink dark:text-paper outline-none focus:border-primary resize-none"
      />
    </div>
  );
}
