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
        <Label className="text-xs text-ash font-normal">Type:</Label>
        <select
          value={authType}
          onChange={(e) => onChange({ authType: e.target.value as any })}
          className="h-7 rounded-[6px]  bg-transparent px-2 text-xs text-ink font-sans font-normal outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="apiKey">API Key</option>
        </select>
      </div>

      {authType === "bearer" && (
        <div className="space-y-1.5 max-w-md">
          <Label className="text-xs text-ash font-normal">Token</Label>
          <Input
            placeholder="eyJhbGciOi..."
            value={bearerToken}
            onChange={(e) => onChange({ bearerToken: e.target.value })}
            className=" text-xs h-8 rounded-[10px] border-hairline font-normal focus-visible:ring-primary focus-visible:ring-offset-0"
          />
        </div>
      )}

      {authType === "basic" && (
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="space-y-1.5">
            <Label className="text-xs text-ash font-normal">Username</Label>
            <Input
              value={basicUser}
              onChange={(e) => onChange({ basicUser: e.target.value })}
              className="text-xs h-8 rounded-[10px] border-hairline font-normal focus-visible:ring-primary focus-visible:ring-offset-0"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-ash font-normal">Password</Label>
            <Input
              type="password"
              value={basicPass}
              onChange={(e) => onChange({ basicPass: e.target.value })}
              className="text-xs h-8 rounded-[10px] border-hairline font-normal focus-visible:ring-primary focus-visible:ring-offset-0"
            />
          </div>
        </div>
      )}

      {authType === "apiKey" && (
        <div className="grid grid-cols-3 gap-3 max-w-lg">
          <div className="space-y-1.5">
            <Label className="text-xs text-ash font-normal">Key</Label>
            <Input
              placeholder="X-API-Key"
              value={apiKeyName}
              onChange={(e) => onChange({ apiKeyName: e.target.value })}
              className=" text-xs h-8 rounded-[10px] border-hairline font-normal focus-visible:ring-primary focus-visible:ring-offset-0"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-ash font-normal">Value</Label>
            <Input
              placeholder="secret-key"
              value={apiKeyValue}
              onChange={(e) => onChange({ apiKeyValue: e.target.value })}
              className=" text-xs h-8 rounded-[10px] border-hairline font-normal focus-visible:ring-primary focus-visible:ring-offset-0"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-ash font-normal">Add to</Label>
            <select
              value={apiKeyLocation}
              onChange={(e) => onChange({ apiKeyLocation: e.target.value as any })}
              className="w-full h-8 rounded-[6px]  bg-transparent px-2 text-xs text-ink font-normal outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="header">Header</option>
              <option value="query">Query Params</option>
            </select>
          </div>
        </div>
      )}

      {authType === "none" && (
        <p className="text-ash text-xs font-normal">
          This request does not use any authorization headers.
        </p>
      )}
    </div>
  );
}
