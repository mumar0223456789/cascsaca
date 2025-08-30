"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Models } from "@/lib/ai-models/models";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentModel, setCurrentModel] = useState("Auto");
  const [tabValue, setTabValue] = useState("Search");
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 flex items-center justify-center w-full p-4"
    >
      <div
        onClick={() => textareaRef.current?.focus()}
        className="max-w-4xl p-5 w-full cursor-text rounded-3xl flex flex-col border-2 gap-5 border-purple-200 bg-purple-50"
      >
        <textarea
          rows={1}
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
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
              type="submit"
              disabled={input.trim().length === 0}
              className="rounded-lg bg-purple-500 hover:bg-purple-600 transition-all duration-300 text-white"
            >
              {input ? (
                <ArrowRight className="size-5" />
              ) : (
                <AudioLines className="size-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
