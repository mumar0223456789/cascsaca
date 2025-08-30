"use client";

import {
  ArrowRight,
  Atom,
  AudioLines,
  Check,
  Cpu,
  Globe,
  Mic,
  Paperclip,
  Search,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Models } from "@/lib/ai-models/models";

export default function LandingChatInputBox() {
  const [tabValue, setTabValue] = useState("Search");
  const [currentModel, setCurrentModel] = useState("Auto");
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
    el.scrollTop = el.scrollHeight;
  }, [prompt]);

  return (
    <div className="flex flex-col h-full items-center justify-center p-3 w-full space-y-10">
      <span className="select-none text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
        Reseach-o-Bot
      </span>
      <div
        onClick={() => textareaRef.current?.focus()}
        className="p-5 w-full max-w-3xl cursor-text rounded-3xl flex flex-col border-2 gap-5 border-purple-200 bg-purple-100/10"
      >
        <textarea
          rows={1}
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            tabValue === "Search" ? "Ask Anything" : "Research Anything"
          }
          className="w-full p-2 outline-0 leading-tight font-medium text-purple-700 max-h-40 overflow-y-auto resize-none"
        />
        <div className="flex items-center justify-between">
          <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
            <TabsList
              onClick={(e) => e.stopPropagation()}
              className="bg-purple-100/50 cursor-auto"
            >
              <TabsTrigger
                value="Search"
                className={cn(
                  "text-purple-500 font-semibold",
                  tabValue === "Search" && "outline-2 outline-purple-500"
                )}
              >
                <Search /> Search Only
              </TabsTrigger>
              <TabsTrigger
                value="Research"
                className={cn(
                  "text-purple-500 font-semibold",
                  tabValue === "Research" && "outline-2 outline-purple-500"
                )}
              >
                <Atom /> Reasearch
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-4 cursor-auto"
          >
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <Cpu className="text-gray-500 size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="left">
                {Models.map((model) => (
                  <DropdownMenuItem
                    onClick={() => setCurrentModel(model.name)}
                    key={model.name}
                  >
                    <div className="w-5">
                      {model.name === currentModel && (
                        <Check className="text-purple-600 w-5 h-5" />
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-gray-700 font-medium">
                        {model.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {model.description}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Globe className="text-gray-500 size-5" />
            <Paperclip className="text-gray-500 size-5" />
            <Mic className="text-gray-500 size-5" />
            <Button
              disabled={prompt.trim().length === 0}
              className="rounded-lg bg-purple-500 hover:bg-purple-600 transition-all duration-300 text-white"
            >
              {prompt ? (
                <ArrowRight className="size-5" />
              ) : (
                <AudioLines className="size-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
