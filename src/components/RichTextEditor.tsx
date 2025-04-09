// src/components/RichTextEditor.tsx
"use client";

import { useEffect, useState } from "react";
import { Bold, Italic, List, ListOrdered, AlignLeft, AlignCenter, Link, Heading1, Heading2, Heading3 } from "lucide-react";
import { Toggle } from "../components/ui/toggle";
import { Separator } from "../components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";


interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const [content, setContent] = useState(value);
  const [linkUrl, setLinkUrl] = useState("");
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);

  // Sync with external value
  useEffect(() => {
    setContent(value);
  }, [value]);

  // Handle internal content change and propagate to parent
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    onChange(newValue);
  };

  // Save selection when textarea is focused
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    if (target.selectionStart !== target.selectionEnd) {
      setSelection({
        start: target.selectionStart,
        end: target.selectionEnd,
        text: target.value.substring(target.selectionStart, target.selectionEnd),
      });
    }
  };

  // Format functions
  const formatText = (tag: string) => {
    const textarea = document.getElementById("editor") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let newText = "";
    
    // Simple HTML tag insertion
    if (tag === "b" || tag === "i" || tag === "h1" || tag === "h2" || tag === "h3" || tag === "li") {
      newText = `<${tag}>${selectedText}</${tag}>`;
    } else if (tag === "ul") {
      // Handle unordered list
      newText = `<ul>\n  <li>${selectedText}</li>\n</ul>`;
    } else if (tag === "ol") {
      // Handle ordered list
      newText = `<ol>\n  <li>${selectedText}</li>\n</ol>`;
    } else if (tag === "center") {
      // Handle centered text
      newText = `<div style="text-align: center">${selectedText}</div>`;
    } else if (tag === "left") {
      // Handle left aligned text
      newText = `<div style="text-align: left">${selectedText}</div>`;
    }
    
    // Insert the formatted text
    const updatedContent = 
      textarea.value.substring(0, start) + 
      newText + 
      textarea.value.substring(end);
    
    setContent(updatedContent);
    onChange(updatedContent);
    
    // Reset focus to the textarea
    textarea.focus();
    
    // Set the selection to after the inserted text
    const newCursorPos = start + newText.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  };

  // Handle link insertion
  const insertLink = () => {
    if (!selection) return;
    
    const linkHtml = `<a href="${linkUrl}">${selection.text}</a>`;
    const newContent = 
      content.substring(0, selection.start) + 
      linkHtml + 
      content.substring(selection.end);
    
    setContent(newContent);
    onChange(newContent);
    setLinkUrl("");
  };
  
  return (
    <div className="w-full border rounded-md">
      {/* Toolbar */}
      <div className="flex items-center bg-muted/40 p-1 gap-0.5 overflow-x-auto">
        <Toggle 
          aria-label="Bold" 
          size="sm"
          onClick={() => formatText("b")}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle 
          aria-label="Italic" 
          size="sm"
          onClick={() => formatText("i")}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        <Toggle 
          aria-label="Heading 1" 
          size="sm"
          onClick={() => formatText("h1")}
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle 
          aria-label="Heading 2" 
          size="sm"
          onClick={() => formatText("h2")}
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle 
          aria-label="Heading 3" 
          size="sm"
          onClick={() => formatText("h3")}
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        <Toggle 
          aria-label="Align Left" 
          size="sm"
          onClick={() => formatText("left")}
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle 
          aria-label="Align Center" 
          size="sm"
          onClick={() => formatText("center")}
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        <Toggle 
          aria-label="Bullet List" 
          size="sm"
          onClick={() => formatText("ul")}
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle 
          aria-label="Numbered List" 
          size="sm"
          onClick={() => formatText("ol")}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        <Popover>
          <PopoverTrigger asChild>
            <Toggle aria-label="Insert Link" size="sm">
              <Link className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <div className="space-y-2">
              <h4 className="font-medium">Insert Link</h4>
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLinkUrl("")}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={insertLink}
                  disabled={!linkUrl || !selection}
                >
                  Insert
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Editor */}
      <textarea
        id="editor"
        className={cn(
          "flex min-h-[200px] w-full rounded-b-md border-0 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        )}
        placeholder={placeholder}
        value={content}
        onChange={handleChange}
        onSelect={handleSelect}
      />
      
      {/* HTML Preview */}
      <div className="p-3 border-t bg-muted/30">
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
            HTML Preview
          </summary>
          <pre className="mt-2 whitespace-pre-wrap bg-muted p-2 rounded text-xs overflow-x-auto">
            {content || "<p>No content yet</p>"}
          </pre>
        </details>
      </div>
    </div>
  );
}