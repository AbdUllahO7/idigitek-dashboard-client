export interface ContentElement {
  _id: string;
  name: string;
  type: "link" | "text" | "video" | "image" | "paragraph" | "heading" | "list" | "custom";
  defaultContent: string;
  parent: string;
  isActive: boolean;
  order: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
} 