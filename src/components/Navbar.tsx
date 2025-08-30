import Link from "next/link";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { PenSquareIcon } from "lucide-react";

interface NavbarProps {
  title?: string;
}

export default function Navbar({ title }: NavbarProps) {
  return (
    <div className="sticky top-0 w-full flex items-center justify-between px-4 py-2 bg-white border-b">
      <SidebarTrigger />
      {title ? (
        <p>{title}</p>
      ) : (
        <span className="select-none text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
          Reseach-o-Bot
        </span>
      )}
      <Button variant="ghost" size="icon">
        <Link href="/">
          <div className="flex text-base font-semibold items-center gap-2">
            <PenSquareIcon className="size-5" />
          </div>
        </Link>
      </Button>
    </div>
  );
}
