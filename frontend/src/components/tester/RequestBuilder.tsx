import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.js";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";
import { HeadersEditor } from "./HeadersEditor.js";
import { BodyEditor } from "./BodyEditor.js";
import { AuthEditor } from "./AuthEditor.js";
import { useTesterStore } from "../../stores/tester.store.js";
import { Send, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils.js";

interface RequestBuilderProps {
  onSend: () => void;
  isSending: boolean;
}

export function RequestBuilder({ onSend, isSending }: RequestBuilderProps) {
  const [subTab, setSubTab] = useState("body");
  const { activeRequest, setActiveRequest } = useTesterStore();

  const getMethodStyle = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "text-emerald-600 dark:text-emerald-400";
      case "POST":
        return "text-blue-600 dark:text-blue-400";
      case "PUT":
        return "text-amber-600 dark:text-amber-400";
      case "PATCH":
        return "text-purple-600 dark:text-purple-400";
      case "DELETE":
        return "text-destructive";
      default:
        return "text-ash";
    }
  };

  return (
    <div className="flex flex-col border-b border-hairline bg-paper dark:bg-card shrink-0">
      {/* Top Bar: Method + Path Input + Send Button */}
      <div className="p-3 pb-2 flex items-center gap-2">
        <select
          value={activeRequest.method}
          onChange={(e) => setActiveRequest({ method: e.target.value })}
          className={cn(
            "h-9 px-2 rounded-md border border-hairline bg-transparent font-mono font-bold text-xs outline-none",
            getMethodStyle(activeRequest.method)
          )}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>

        <Input
          value={activeRequest.path}
          onChange={(e) => setActiveRequest({ path: e.target.value })}
          placeholder="/users"
          className="flex-1 h-9 rounded-[10px] border-hairline font-mono text-xs"
        />

        <Button
          onClick={onSend}
          disabled={isSending}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs gap-1.5 shrink-0"
        >
          {isSending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>Send</span>
        </Button>
      </div>

      {/* Sub Tabs: Params, Headers, Body, Auth */}
      <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
        <TabsList className="h-8 justify-start border-b border-hairline bg-paper dark:bg-card px-3 gap-1 rounded-none">
          <TabsTrigger value="body" className="text-xs h-6 px-2 rounded font-sans">
            Body
          </TabsTrigger>
          <TabsTrigger value="headers" className="text-xs h-6 px-2 rounded font-sans">
            Headers ({Object.keys(activeRequest.headers || {}).length})
          </TabsTrigger>
          <TabsTrigger value="auth" className="text-xs h-6 px-2 rounded font-sans">
            Auth
          </TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="m-0">
          <BodyEditor
            body={activeRequest.body}
            bodyType={activeRequest.bodyType}
            onChange={(body) => setActiveRequest({ body })}
            onTypeChange={(bodyType) => setActiveRequest({ bodyType })}
          />
        </TabsContent>

        <TabsContent value="headers" className="m-0">
          <HeadersEditor
            headers={activeRequest.headers}
            onChange={(headers) => setActiveRequest({ headers })}
          />
        </TabsContent>

        <TabsContent value="auth" className="m-0">
          <AuthEditor
            authType={activeRequest.authType}
            bearerToken={activeRequest.bearerToken}
            basicUser={activeRequest.basicUser}
            basicPass={activeRequest.basicPass}
            apiKeyName={activeRequest.apiKeyName}
            apiKeyValue={activeRequest.apiKeyValue}
            apiKeyLocation={activeRequest.apiKeyLocation}
            onChange={setActiveRequest}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
