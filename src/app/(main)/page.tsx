import ChatInterface from "@/components/chat/ChatInterface";
import AppSidebar from "@/components/sidebar/AppSidebar";

export default function Home() {
  return (
    <div className="flex w-full h-full bg-gray-100">
      <AppSidebar />
      <ChatInterface />
    </div>
  );
}
