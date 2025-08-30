"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import LandingChatInputBox from "./LandingChatInputBox";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center h-full w-full">
      <div className="sticky top-0 z-50 w-full flex items-center justify-end px-4 py-2 gap-3">
        <Button variant="outline" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
      <div className="justify-center h-full w-full">
        <LandingChatInputBox />
      </div>
    </main>
  );
}
