import { Input } from "../ui/input.js";
import { Label } from "../ui/label.js";

interface AuthEditorProps {
  authType: "none" | "bearer" | "basic" | "apiKey";
  bearerToken?: string;
  basicUser?: string;
  basicPass?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyLocation?: "header" | "query";
  onChange: (fields: any) => void;
}

export function AuthEditor({
  authType,
  bearerToken = "",
  basicUser = "",
  basicPass = "",
  apiKeyName = "",
  apiKeyValue = "",
  apiKeyLocation = "header",
  onChange,
}: AuthEditorProps) {
  return (
    <div className="p-3 space-y-4 font-sans text-xs">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-ash">Type:</Label>
        <select
          value={authType}
          onChange={(e) => onChange({ authType: e.target.value as any })}
          className="h-7 rounded-md border border-hairline bg-transparent px-2 text-xs text-ink dark:text-paper font-sans"
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="apiKey">API Key</option>
        </select>
      </div>

      {authType === "bearer" && (
        <div className="space-y-1.5 max-w-md">
          <Label className="text-xs text-ash">Token</Label>
          <Input
            placeholder="eyJhbGciOi..."
            value={bearerToken}
            onChange={(e) => onChange({ bearerToken: e.target.value })}
            className="font-mono text-xs h-8 rounded-md border-hairline"
          />
        </div>
      )}

      {authType === "basic" && (
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="space-y-1.5">
            <Label className="text-xs text-ash">Username</Label>
            <Input
              value={basicUser}
              onChange={(e) => onChange({ basicUser: e.target.value })}
              className="text-xs h-8 rounded-md border-hairline"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-ash">Password</Label>
            <Input
              type="password"
              value={basicPass}
              onChange={(e) => onChange({ basicPass: e.target.value })}
              className="text-xs h-8 rounded-md border-hairline"
            />
          </div>
        </div>
      )}

      {authType === "apiKey" && (
        <div className="grid grid-cols-3 gap-3 max-w-lg">
          <div className="space-y-1.5">
            <Label className="text-xs text-ash">Key</Label>
            <Input
              placeholder="X-API-Key"
              value={apiKeyName}
              onChange={(e) => onChange({ apiKeyName: e.target.value })}
              className="font-mono text-xs h-8 rounded-md border-hairline"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-ash">Value</Label>
            <Input
              placeholder="secret-key"
              value={apiKeyValue}
              onChange={(e) => onChange({ apiKeyValue: e.target.value })}
              className="font-mono text-xs h-8 rounded-md border-hairline"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-ash">Add to</Label>
            <select
              value={apiKeyLocation}
              onChange={(e) => onChange({ apiKeyLocation: e.target.value as any })}
              className="w-full h-8 rounded-md border border-hairline bg-transparent px-2 text-xs text-ink dark:text-paper"
            >
              <option value="header">Header</option>
              <option value="query">Query Params</option>
            </select>
          </div>
        </div>
      )}

      {authType === "none" && (
        <p className="text-ash text-xs">
          This request does not use any authorization headers.
        </p>
      )}
    </div>
  );
}
