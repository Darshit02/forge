import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";

interface HeadersEditorProps {
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
}

export function HeadersEditor({ headers, onChange }: HeadersEditorProps) {
  const [rows, setRows] = useState<Array<{ key: string; value: string }>>([]);

  useEffect(() => {
    const list = Object.entries(headers).map(([key, value]) => ({
      key,
      value,
    }));
    if (list.length === 0) {
      list.push({ key: "", value: "" });
    }
    setRows(list);
  }, []);

  const updateHeaderRow = (index: number, key: string, value: string) => {
    const newRows = [...rows];
    newRows[index] = { key, value };
    setRows(newRows);

    const result: Record<string, string> = {};
    for (const r of newRows) {
      if (r.key.trim()) {
        result[r.key.trim()] = r.value;
      }
    }
    onChange(result);
  };

  const addRow = () => {
    setRows([...rows, { key: "", value: "" }]);
  };

  const removeRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows.length > 0 ? newRows : [{ key: "", value: "" }]);

    const result: Record<string, string> = {};
    for (const r of newRows) {
      if (r.key.trim()) {
        result[r.key.trim()] = r.value;
      }
    }
    onChange(result);
  };

  return (
    <div className="space-y-2 p-3 font-sans text-xs">
      <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-[0.018em] text-ash font-normal pb-1 border-b border-hairline">
        <span className="col-span-5">Key</span>
        <span className="col-span-6">Value</span>
        <span className="col-span-1" />
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <Input
              placeholder="Content-Type"
              value={row.key}
              onChange={(e) => updateHeaderRow(idx, e.target.value, row.value)}
              className="col-span-5 h-7 text-xs font-mono rounded-[10px] border-hairline font-normal"
            />
            <Input
              placeholder="application/json"
              value={row.value}
              onChange={(e) => updateHeaderRow(idx, row.key, e.target.value)}
              className="col-span-6 h-7 text-xs font-mono rounded-[10px] border-hairline font-normal"
            />
            <button
              onClick={() => removeRow(idx)}
              className="col-span-1 p-1 text-ash hover:text-destructive flex justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <Button
        size="xs"
        variant="outline"
        onClick={addRow}
        className="mt-2 text-xs rounded-[6px] border-hairline text-ash hover:text-ink font-normal"
      >
        <Plus className="w-3 h-3 mr-1" />
        Add Header
      </Button>
    </div>
  );
}
