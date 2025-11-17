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
      {/* Enhanced Toolbar */}
      <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6 flex-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
          </button>
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
            {filteredModules.length} of {modules.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(previewMode === "split" ? "full" : "split")}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            title={previewMode === "split" ? "Full preview" : "Split view"}
          >
            {previewMode === "split" ? <Maximize2 className="h-6 w-6" /> : <Minimize2 className="h-6 w-6" />}
          </button>
          <button
            onClick={() => updateMutation.mutate({ projectId, modules })}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
          >
            <Save className="h-5 w-5" />
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Enhanced Sidebar */}
        {sidebarOpen && (
          <div className="w-96 border-r-2 border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-y-auto">
            <div className="p-6 space-y-4">
              {filteredModules.length === 0 ? (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <p className="text-xl font-semibold">No modules found</p>
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
                        group relative p-6 rounded-2xl border-4 cursor-pointer transition-all shadow-lg hover:shadow-xl
                        ${isSelected
                          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 shadow-xl scale-[1.02]"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                        }
                        ${isDragging ? "opacity-50 scale-95" : ""}
                        ${isHovered && draggedIndex !== null ? "border-blue-400 border-dashed" : ""}
                      `}
                    >
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-lg font-bold flex items-center justify-center shadow-lg">
                        {actualIndex + 1}
                      </div>
                      <div className="pl-8 pr-12">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2">
                          {module.content.headline || `Module ${actualIndex + 1}`}
                        </h4>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold">
                            {module.type}
                          </span>
                          {module.content.imageDescriptions && module.content.imageDescriptions.length > 0 && (
                            <span className="text-base text-gray-600 dark:text-gray-400 flex items-center gap-2 font-semibold">
                              <ImageIcon className="h-5 w-5" />
                              {module.content.imageDescriptions.length}
                            </span>
                          )}
                        </div>
                        {module.content.bodyText && (
                          <p className="text-base text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                            {module.content.bodyText}
                          </p>
                        )}
                      </div>
                      <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {module.content.imageDescriptions && module.content.imageDescriptions.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              generateImagesMutation.mutate({ projectId, moduleIndex: actualIndex });
                            }}
                            disabled={generateImagesMutation.isPending}
                            className="p-2.5 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            title="Generate images"
                          >
                            <Sparkles className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(actualIndex);
                          }}
                          className="p-2.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(actualIndex);
                          }}
                          className="p-2.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(actualIndex);
                          }}
                          className="p-2.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
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
              {/* Enhanced Editor Panel */}
              <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                {editingIndex !== null && editedContent ? (
                  <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Module</h3>
                      <button
                        onClick={() => {
                          setEditingIndex(null);
                          setEditedContent(null);
                        }}
                        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">
                          Headline
                        </label>
                        <input
                          type="text"
                          value={editedContent.headline || ""}
                          onChange={(e) => setEditedContent({ ...editedContent, headline: e.target.value })}
                          className="w-full px-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">
                          Body Text
                        </label>
                        <textarea
                          value={editedContent.bodyText || ""}
                          onChange={(e) => setEditedContent({ ...editedContent, bodyText: e.target.value })}
                          rows={10}
                          className="w-full px-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all leading-relaxed"
                        />
                      </div>
                      {editedContent.bullets && (
                        <div>
                          <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">
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
                            rows={8}
                            className="w-full px-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all leading-relaxed"
                          />
                        </div>
                      )}
                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={handleSave}
                          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditingIndex(null);
                            setEditedContent(null);
                          }}
                          className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-lg font-semibold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : selectedModule ? (
                  <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        {selectedModule.content.headline || "Module"}
                      </h2>
                      <div className="flex items-center gap-4">
                        <span className="px-4 py-2 bg-blue-600 text-white text-base font-bold rounded-xl">
                          {selectedModule.type}
                        </span>
                        {selectedModule.content.imageDescriptions && selectedModule.content.imageDescriptions.length > 0 && (
                          <button
                            onClick={() => {
                              generateImagesMutation.mutate({ projectId, moduleIndex: selectedIndex! });
                            }}
                            disabled={generateImagesMutation.isPending}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-base font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all hover:scale-105 shadow-lg"
                          >
                            <Sparkles className="h-5 w-5" />
                            {generateImagesMutation.isPending ? "Generating..." : "Generate Images"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Content</h3>
                      {selectedModule.content.bodyText && (
                        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                          {selectedModule.content.bodyText}
                        </p>
                      )}
                      {selectedModule.content.bullets && selectedModule.content.bullets.length > 0 && (
                        <ul className="list-disc list-inside space-y-3 text-lg text-gray-700 dark:text-gray-300">
                          {selectedModule.content.bullets.map((bullet, i) => (
                            <li key={i} className="leading-relaxed">{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {selectedModule.content.imageDescriptions && selectedModule.content.imageDescriptions.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Image Descriptions ({selectedModule.content.imageDescriptions.length})
                          </h3>
                          <button
                            onClick={() => {
                              generateImagesMutation.mutate({ projectId, moduleIndex: selectedIndex! });
                            }}
                            disabled={generateImagesMutation.isPending}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-base font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all hover:scale-105 shadow-lg"
                          >
                            <Sparkles className="h-5 w-5" />
                            Generate All
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedModule.content.imageDescriptions.map((desc, i) => {
                            const imageIndex = i % allImages.length;
                            const image = allImages[imageIndex];
                            return (
                              <div
                                key={i}
                                className="group relative p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-all"
                              >
                                <div className="flex items-start gap-4">
                                  {image ? (
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                                      <Image src={image.url} alt={desc} fill className="object-cover" sizes="80px" />
                                    </div>
                                  ) : (
                                    <div className="w-20 h-20 rounded-xl bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                      <ImageIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-base text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">{desc}</p>
                                    {image && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 inline-block font-semibold">
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
                      <p className="text-2xl font-bold mb-3">Select a module to edit</p>
                      <p className="text-lg">Choose a module from the sidebar</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Preview Panel */}
              <div className="w-1/2 border-l-2 border-gray-200 dark:border-gray-700 overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
                {selectedModule ? (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                      <div
                        className="px-8 py-6 border-b-2 border-gray-200 dark:border-gray-700"
                        style={{
                          backgroundColor: brandKit?.primaryColor ? `${brandKit.primaryColor}15` : undefined,
                        }}
                      >
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {selectedModule.content.headline || "Module Preview"}
                        </h4>
                      </div>
                      <div className="p-8">
                        {selectedModule.content.bodyText && (
                          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                            {selectedModule.content.bodyText}
                          </p>
                        )}
                        {selectedModule.content.imageDescriptions && selectedModule.content.imageDescriptions.length > 0 && (
                          <div className="grid grid-cols-2 gap-4 mt-6">
                            {selectedModule.content.imageDescriptions.map((desc, i) => {
                              const imageIndex = i % allImages.length;
                              const image = allImages[imageIndex];
                              return (
                                <div
                                  key={i}
                                  className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shadow-lg"
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
                                      <ImageIcon className="h-10 w-10 text-gray-400" />
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
                      <p className="text-2xl font-bold mb-3">Select a module to preview</p>
                      <p className="text-lg">Choose a module from the sidebar</p>
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
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {module.content.headline || `Module ${index + 1}`}
                      </h4>
                    </div>
                    <div className="p-8">
                      {module.content.bodyText && (
                        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
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
