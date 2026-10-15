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

  const getMethodStyle = (_method: string) => {
    return "text-ink  font-normal";
  };

  return (
    <div className="flex flex-col border-b border-hairline bg-paper shrink-0">
      {/* Top Bar: Method + Path Input + Send Button */}
      <div className="p-3 pb-2 flex items-center gap-2">
        <select
          value={activeRequest.method}
          onChange={(e) => setActiveRequest({ method: e.target.value })}
          className={cn(
            "h-9 px-2.5 rounded-[6px]  bg-transparent  font-normal text-xs outline-none focus:ring-1 focus:ring-primary text-ink",
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
          className="flex-1 h-9 rounded-[10px] border-hairline  text-xs"
        />

        <Button
          onClick={onSend}
          disabled={isSending}
          className="h-9 px-4 rounded-[6px] bg-primary text-ink hover:bg-primary/90 font-normal text-xs gap-1.5 shrink-0"
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
        <TabsList className="h-8 justify-start border-b border-hairline bg-paper px-3 gap-1 rounded-none">
          <TabsTrigger value="body" className="text-xs h-6 px-2.5 rounded-[6px] font-sans font-normal">
            Body
          </TabsTrigger>
          <TabsTrigger value="headers" className="text-xs h-6 px-2.5 rounded-[6px] font-sans font-normal">
            Headers ({Object.keys(activeRequest.headers || {}).length})
          </TabsTrigger>
          <TabsTrigger value="auth" className="text-xs h-6 px-2.5 rounded-[6px] font-sans font-normal">
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
