"use client";

/**
 * A+ Content Editor Component
 * 
 * Professional split-pane editor with drag-and-drop, search, and live preview
 */

import { useState, useRef } from "react";
import { api } from "@/lib/trpc/react";
import { toast } from "react-toastify";
import {
  GripVertical,
  Edit2,
  Trash2,
  Copy,
  Save,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

export interface APlusModule {
  type: string;
  templateId?: string;
  content: {
    headline?: string;
    bodyText?: string;
    bullets?: string[];
    sidebar?: string[];
    specifications?: Record<string, string>;
    imageDescriptions?: string[];
  };
  template?: any;
}

interface APlusEditorProps {
  projectId: string;
  modules: APlusModule[];
  productName?: string;
  brandKit?: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
  } | null;
  productImages?: Array<{ id: string; url: string }>;
  generatedImages?: Array<{ id: string; url: string; type: string }>;
  onSave?: () => void;
}

export function APlusEditor({
  projectId,
  modules: initialModules,
  productName,
  brandKit,
  productImages = [],
  generatedImages = [],
  onSave,
}: APlusEditorProps) {
  const [modules, setModules] = useState<APlusModule[]>(initialModules);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<APlusModule["content"] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<"split" | "full">("split");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const updateMutation = api.aPlus.update.useMutation({
    onSuccess: () => {
      toast.success("Changes saved");
      setEditingIndex(null);
      setEditedContent(null);
      onSave?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save");
    },
  });

  const generateImagesMutation = api.aPlus.generateImages.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.generatedCount} image(s)`);
      onSave?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate images");
    },
  });

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setHoveredIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setHoveredIndex(null);
      return;
    }

    const newModules = [...modules];
    const draggedModule = newModules[draggedIndex];
    newModules.splice(draggedIndex, 1);
    newModules.splice(dropIndex, 0, draggedModule);

    setModules(newModules);
    setDraggedIndex(null);
    setHoveredIndex(null);
    updateMutation.mutate({ projectId, modules: newModules });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setSelectedIndex(index);
    setEditedContent({ ...modules[index]!.content });
  };

  const handleSave = () => {
    if (editingIndex === null || !editedContent) return;
    const updatedModules = [...modules];
    updatedModules[editingIndex] = {
      ...updatedModules[editingIndex]!,
      content: editedContent,
    };
    setModules(updatedModules);
    updateMutation.mutate({ projectId, modules: updatedModules });
  };

  const handleDelete = (index: number) => {
    if (!confirm("Delete this module?")) return;
    const newModules = modules.filter((_, i) => i !== index);
    setModules(newModules);
    updateMutation.mutate({ projectId, modules: newModules });
    if (selectedIndex === index) setSelectedIndex(null);
  };

  const handleDuplicate = (index: number) => {
    const module = modules[index];
    if (!module) return;
    const duplicated: APlusModule = {
      ...module,
      content: {
        ...module.content,
        headline: `${module.content.headline || "Module"} (Copy)`,
      },
    };
    const newModules = [...modules];
    newModules.splice(index + 1, 0, duplicated);
    setModules(newModules);
    updateMutation.mutate({ projectId, modules: newModules });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newModules = [...modules];
    [newModules[index - 1], newModules[index]] = [newModules[index]!, newModules[index - 1]!];
    setModules(newModules);
    updateMutation.mutate({ projectId, modules: newModules });
  };

  const handleMoveDown = (index: number) => {
    if (index === modules.length - 1) return;
    const newModules = [...modules];
    [newModules[index], newModules[index + 1]] = [newModules[index + 1]!, newModules[index]!];
    setModules(newModules);
    updateMutation.mutate({ projectId, modules: newModules });
  };

  const filteredModules = modules.filter((module) => {
    const query = searchQuery.toLowerCase();
    return (
      module.content.headline?.toLowerCase().includes(query) ||
      module.content.bodyText?.toLowerCase().includes(query) ||
      module.type.toLowerCase().includes(query)
    );
  });

  const selectedModule = selectedIndex !== null ? modules[selectedIndex] : null;
  const allImages = [
    ...productImages.map((img) => ({ ...img, source: "product" as const })),
    ...generatedImages.map((img) => ({ ...img, source: "generated" as const })),
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredModules.length} of {modules.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(previewMode === "split" ? "full" : "split")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={previewMode === "split" ? "Full preview" : "Split view"}
          >
            {previewMode === "split" ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
          </button>
          <button
            onClick={() => updateMutation.mutate({ projectId, modules })}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
            <div className="p-4 space-y-2">
              {filteredModules.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No modules found</p>
                </div>
              ) : (
                filteredModules.map((module, displayIndex) => {
                  const actualIndex = modules.indexOf(module);
                  const isSelected = selectedIndex === actualIndex;
                  const isDragging = draggedIndex === actualIndex;
                  const isHovered = hoveredIndex === actualIndex;

                  return (
                    <div
                      key={actualIndex}
                      draggable
                      onDragStart={() => handleDragStart(actualIndex)}
                      onDragOver={(e) => handleDragOver(e, actualIndex)}
                      onDrop={(e) => handleDrop(e, actualIndex)}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setHoveredIndex(null);
                      }}
                      onClick={() => setSelectedIndex(actualIndex)}
                      className={`
                        group relative p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                        }
                        ${isDragging ? "opacity-50 scale-95" : ""}
                        ${isHovered && draggedIndex !== null ? "border-blue-400 border-dashed" : ""}
                      `}
                    >
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                        {actualIndex + 1}
                      </div>
                      <div className="pl-6 pr-8">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">
                          {module.content.headline || `Module ${actualIndex + 1}`}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            {module.type}
                          </span>
                          {module.content.imageDescriptions && module.content.imageDescriptions.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              {module.content.imageDescriptions.length}
                            </span>
                          )}
                        </div>
                        {module.content.bodyText && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {module.content.bodyText}
                          </p>
                        )}
                      </div>
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {module.content.imageDescriptions && module.content.imageDescriptions.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              generateImagesMutation.mutate({ projectId, moduleIndex: actualIndex });
                            }}
                            disabled={generateImagesMutation.isPending}
                            className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                            title="Generate images"
                          >
                            <Sparkles className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(actualIndex);
                          }}
                          className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-gray-600 dark:text-gray-400 hover:text-green-600"
                          title="Duplicate"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(actualIndex);
                          }}
                          className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-gray-600 dark:text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(actualIndex);
                          }}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-600 dark:text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Editor/Preview Area */}
        <div className="flex-1 flex overflow-hidden">
          {previewMode === "split" ? (
            <>
              {/* Editor Panel */}
              <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800">
                {editingIndex !== null && editedContent ? (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Module</h3>
                      <button
                        onClick={() => {
                          setEditingIndex(null);
                          setEditedContent(null);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Headline
                        </label>
                        <input
                          type="text"
                          value={editedContent.headline || ""}
                          onChange={(e) => setEditedContent({ ...editedContent, headline: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Body Text
                        </label>
                        <textarea
                          value={editedContent.bodyText || ""}
                          onChange={(e) => setEditedContent({ ...editedContent, bodyText: e.target.value })}
                          rows={8}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {editedContent.bullets && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bullet Points
                          </label>
                          <textarea
                            value={editedContent.bullets.join("\n")}
                            onChange={(e) =>
                              setEditedContent({
                                ...editedContent,
                                bullets: e.target.value.split("\n").filter((b) => b.trim()),
                              })
                            }
                            rows={6}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditingIndex(null);
                            setEditedContent(null);
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : selectedModule ? (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {selectedModule.content.headline || "Module"}
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                          {selectedModule.type}
                        </span>
                        {selectedModule.content.imageDescriptions && selectedModule.content.imageDescriptions.length > 0 && (
                          <button
                            onClick={() => {
                              generateImagesMutation.mutate({ projectId, moduleIndex: selectedIndex! });
                            }}
                            disabled={generateImagesMutation.isPending}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 disabled:opacity-50 transition-all hover:scale-105"
                          >
                            <Sparkles className="h-3 w-3" />
                            {generateImagesMutation.isPending ? "Generating..." : "Generate Images"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Content</h3>
                      {selectedModule.content.bodyText && (
                        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                          {selectedModule.content.bodyText}
                        </p>
                      )}
                      {selectedModule.content.bullets && selectedModule.content.bullets.length > 0 && (
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                          {selectedModule.content.bullets.map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {selectedModule.content.imageDescriptions && selectedModule.content.imageDescriptions.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Image Descriptions ({selectedModule.content.imageDescriptions.length})
                          </h3>
                          <button
                            onClick={() => {
                              generateImagesMutation.mutate({ projectId, moduleIndex: selectedIndex! });
                            }}
                            disabled={generateImagesMutation.isPending}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all hover:scale-105 shadow-md"
                          >
                            <Sparkles className="h-3 w-3" />
                            Generate All
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedModule.content.imageDescriptions.map((desc, i) => {
                            const imageIndex = i % allImages.length;
                            const image = allImages[imageIndex];
                            return (
                              <div
                                key={i}
                                className="group relative p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-all"
                              >
                                <div className="flex items-start gap-3">
                                  {image ? (
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                      <Image src={image.url} alt={desc} fill className="object-cover" sizes="64px" />
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                      <ImageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{desc}</p>
                                    {image && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">
                                        {image.source === "product" ? "Product Image" : "Generated"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <p className="text-lg font-medium mb-2">Select a module to edit</p>
                      <p className="text-sm">Choose a module from the sidebar</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Panel */}
              <div className="w-1/2 border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
                {selectedModule ? (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <div
                        className="px-6 py-4 border-b border-gray-200 dark:border-gray-700"
                        style={{
                          backgroundColor: brandKit?.primaryColor ? `${brandKit.primaryColor}15` : undefined,
                        }}
                      >
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {selectedModule.content.headline || "Module Preview"}
                        </h4>
                      </div>
                      <div className="p-6">
                        {selectedModule.content.bodyText && (
                          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                            {selectedModule.content.bodyText}
                          </p>
                        )}
                        {selectedModule.content.imageDescriptions && selectedModule.content.imageDescriptions.length > 0 && (
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            {selectedModule.content.imageDescriptions.map((desc, i) => {
                              const imageIndex = i % allImages.length;
                              const image = allImages[imageIndex];
                              return (
                                <div
                                  key={i}
                                  className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                                >
                                  {image ? (
                                    <Image
                                      src={image.url}
                                      alt={desc}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 50vw, 25vw"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <p className="text-sm">Select a module to preview</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
              {/* Full preview - render all modules */}
              <div className="max-w-4xl mx-auto space-y-8">
                {modules.map((module, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                  >
                    <div
                      className="px-6 py-4 border-b border-gray-200 dark:border-gray-700"
                      style={{
                        backgroundColor: brandKit?.primaryColor ? `${brandKit.primaryColor}15` : undefined,
                      }}
                    >
                      <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {module.content.headline || `Module ${index + 1}`}
                      </h4>
                    </div>
                    <div className="p-6">
                      {module.content.bodyText && (
                        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                          {module.content.bodyText}
                        </p>
                      )}
                      {module.content.imageDescriptions && module.content.imageDescriptions.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          {module.content.imageDescriptions.map((desc, i) => {
                            const imageIndex = i % allImages.length;
                            const image = allImages[imageIndex];
                            return (
                              <div
                                key={i}
                                className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                              >
                                {image ? (
                                  <Image
                                    src={image.url}
                                    alt={desc}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
