import { useState } from "react";
import { 
  MessageSquare, 
  Plus, 
  Settings, 
  User, 
  LogOut, 
  PanelLeftClose, 
  PanelLeftOpen,
  Search,
  Database,
  Bot,
  Trash2,
  Key,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Conversation } from "@/lib/mockData";

interface AppSidebarProps {
  currentConversationId?: string;
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
}

export function AppSidebar({ 
  currentConversationId, 
  conversations,
  onSelectConversation, 
  onNewChat,
  onDeleteConversation
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const filteredConversations = conversations.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div 
        className={cn(
          "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-[60px]" : "w-[280px]"
        )}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2 font-mono font-bold text-sidebar-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Bot size={20} />
              </div>
              <span>BOT GPT</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto h-8 w-8 text-sidebar-foreground/70"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </Button>
        </div>

        {/* New Chat & Search */}
        <div className="px-4 mb-2 space-y-2">
          <Button 
            onClick={onNewChat}
            className={cn(
              "w-full justify-start gap-2 font-medium shadow-sm transition-all", 
              collapsed ? "px-0 justify-center" : ""
            )}
          >
            <Plus size={18} />
            {!collapsed && "New Chat"}
          </Button>
          
          {!collapsed && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search chats..." 
                className="pl-8 h-9 bg-sidebar-accent/50 border-sidebar-border focus:bg-background transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 py-2">
            {filteredConversations.map((chat) => (
              <div key={chat.id} className="group relative flex items-center">
                <Button
                  variant={currentConversationId === chat.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto py-3 px-3 font-normal text-left transition-all hover:bg-sidebar-accent/70 pr-8",
                    collapsed ? "justify-center px-0" : ""
                  )}
                  onClick={() => onSelectConversation(chat.id)}
                >
                  {chat.mode === 'rag' ? (
                    <Database className="h-4 w-4 shrink-0 text-blue-500 mr-2" />
                  ) : (
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
                  )}
                  
                  {!collapsed && (
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-sm font-medium text-sidebar-foreground">
                        {chat.title || "New Conversation"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {new Date(chat.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </Button>
                {!collapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(chat.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-sidebar-border mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full justify-start h-12 gap-3 px-2 hover:bg-sidebar-accent",
                  collapsed ? "justify-center" : ""
                )}
              >
                <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center border border-sidebar-border">
                  <User size={16} />
                </div>
                {!collapsed && (
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-medium">Demo User</span>
                    <span className="text-xs text-muted-foreground">demo@botgpt.ai</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure your API keys and preferences for BOT GPT.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="api-key" className="flex items-center gap-2">
                <Key className="h-4 w-4" /> GROQ API Key
              </Label>
              <Input id="api-key" type="password" value="gsk_**********************" disabled />
              <p className="text-[10.5px] text-muted-foreground">
                API key is managed via environment variables in this demo.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" /> Model
              </Label>
              <Input id="model" value="llama3-70b-8192" disabled />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => setSettingsOpen(false)}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
