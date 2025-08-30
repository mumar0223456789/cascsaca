"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Loader2,
  LogOut,
  MessageSquare,
  PenSquareIcon,
  User,
  X,
} from "lucide-react";
import { useFeedback } from "@/hooks/use-feedback";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { UserProfileDialog } from "../userProfile/UserProfileDialog";
import { FeedbackDialog } from "../dialogs/FeedbackDialog";
import { ConfirmLogoutDialog } from "../dialogs/ConfirmLogoutDialog";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useConversations } from "@/hooks/conversation/useConversations";
import AnimatedTitle from "./AnimatedTitle";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_KEY = "animatedTitles";

export default function AppSidebar() {
  const { user, isUpdatingUserProfile, updateUser } = useUser();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showLogoutConfirmDialog, setShowLogoutConfirmDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const queryClient = useQueryClient();
  const { data: conversations, isLoading } = useConversations();
  const params = useParams();
  const conversationId = params?.conversationId as string | undefined;

  const [hasTitleTyped, setHasTitleTyped] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      console.error(
        "Failed to parse animated titles from localStorage:",
        error
      );
      return new Set();
    }
  });

  const handleAnimationComplete = (id: string) => {
    setHasTitleTyped((prev) => new Set(prev).add(id));
  };

  const { handleFeedbackSubmit } = useFeedback();

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(Array.from(hasTitleTyped))
    );
  }, [hasTitleTyped]);

  const handleNewChat = () => {
    queryClient.setQueryData(["messages", null], []);
    router.push("/");
  };

  const handleLogoutConfirmation = () => {
    setShowLogoutConfirmDialog(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();

    await supabase.auth.signOut();
    router.push("/");
    setIsLoggingOut(false);
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await handleLogout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirmDialog(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader className="flex flex-col items-center justify-center select-none pb-0">
          <div className="pt-4 px-2 w-full flex flex-row justify-between md:justify-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
              Reseach-o-Bot
            </span>
            <Button
              variant="ghost"
              className="flex justify-center items-center md:hidden"
              onClick={() => toggleSidebar()}
            >
              <X />
            </Button>
          </div>

          <SidebarGroup className="pb-0">
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="py-5 px-2"
                    onClick={handleNewChat}
                  >
                    <div>
                      <div className="flex text-base font-semibold items-center gap-2">
                        <PenSquareIcon className="size-5" />
                        New Chat
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </SidebarGroup>
        </SidebarHeader>
        <SidebarContent>
          {isLoading ? (
            <div className="w-full flex justify-center p-3">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <SidebarGroup>
              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="flex flex-col gap-1">
                  {conversations?.map((conversation) => (
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex items-center justify-start",
                        conversation.id === conversationId && "bg-accent"
                      )}
                      key={conversation.id}
                      onClick={() => router.push(`/c/${conversation.id}`)}
                    >
                      <span className="flex items-center overflow-hidden">
                        {conversation.isTitleGenerating ||
                        conversation.title === "New Chat" ? (
                          <span className="text-gray-400">New Chat</span>
                        ) : !hasTitleTyped.has(conversation.id) ? (
                          <AnimatedTitle
                            title={conversation.title}
                            onAnimationComplete={() =>
                              handleAnimationComplete(conversation.id)
                            }
                          />
                        ) : conversation.title.length > 30 ? (
                          conversation.title.slice(0, 30).trim() + "..."
                        ) : (
                          conversation.title
                        )}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex flex-row items-center gap-2 h-12 px-2"
              >
                <div className="flex items-center justify-center">
                  <Avatar className="size-10">
                    <AvatarImage
                      src={user.avatarUrl || ""}
                      alt={user.name || user?.email}
                    />
                    <AvatarFallback className="text-lg">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
                        {user.name ? (
                          user.name.charAt(0).toUpperCase()
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col w-full items-start justify-start">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-card/70 backdrop-blur-sm px-3"
            >
              <DropdownMenuItem
                onClick={() => setShowUserProfile(true)}
                className="focus:bg-accent/30"
              >
                <User className="w-4 h-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowFeedbackDialog(true)}
                className="focus:bg-accent/30"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Feedback
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogoutConfirmation}
                className="focus:bg-accent/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <UserProfileDialog
        open={showUserProfile}
        onOpenChange={setShowUserProfile}
        user={user}
        updateUser={updateUser}
        isUpdatingUserProfile={isUpdatingUserProfile}
      />

      <FeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        onSubmit={handleFeedbackSubmit}
      />

      {/*<ConfirmDeleteDialog
          open={isConfirmDialogOpen}
          onOpenChange={setIsConfirmDialogOpen}
          onConfirm={() => deleteMessagesMutation.mutate(messagesToDelete)}
          isLoading={deleteMessagesMutation.isPending}
          messageCount={messagesToDelete.length}
        />*/}

      <ConfirmLogoutDialog
        open={showLogoutConfirmDialog}
        onOpenChange={setShowLogoutConfirmDialog}
        onConfirm={performLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
}
