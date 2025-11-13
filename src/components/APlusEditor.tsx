"use client";

/**
 * A+ Content Editor Component
 * 
 * Allows editing and reordering A+ content modules
 */

import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { toast } from "react-toastify";
import { GripVertical, Edit2, Trash2, Plus, Save } from "lucide-react";

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
  onSave?: () => void;
}

export function APlusEditor({ projectId, modules: initialModules, onSave }: APlusEditorProps) {
  const [modules, setModules] = useState<APlusModule[]>(initialModules);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<APlusModule["content"] | null>(null);

  const updateMutation = api.aPlus.update.useMutation({
    onSuccess: () => {
      toast.success("A+ content updated successfully");
      setEditingIndex(null);
      setEditedContent(null);
      onSave?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update A+ content");
    },
  });

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditedContent({ ...modules[index]!.content });
  };

  const handleSave = (index: number) => {
    if (!editedContent) return;

    const updatedModules = [...modules];
    updatedModules[index] = {
      ...updatedModules[index]!,
      content: editedContent,
    };

    updateMutation.mutate({
      projectId,
      modules: updatedModules,
    });
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditedContent(null);
  };

  const handleDelete = (index: number) => {
    if (!confirm("Are you sure you want to delete this module?")) return;

    const updatedModules = modules.filter((_, i) => i !== index);
    updateMutation.mutate({
      projectId,
      modules: updatedModules,
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updatedModules = [...modules];
    [updatedModules[index - 1], updatedModules[index]] = [
      updatedModules[index]!,
      updatedModules[index - 1]!,
    ];
    setModules(updatedModules);
    updateMutation.mutate({
      projectId,
      modules: updatedModules,
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === modules.length - 1) return;
    const updatedModules = [...modules];
    [updatedModules[index], updatedModules[index + 1]] = [
      updatedModules[index + 1]!,
      updatedModules[index]!,
    ];
    setModules(updatedModules);
    updateMutation.mutate({
      projectId,
      modules: updatedModules,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          A+ Content Modules
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {modules.length} module{modules.length !== 1 ? "s" : ""}
        </span>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            No modules yet. Generate A+ content to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start gap-4">
                {/* Drag handle and order controls */}
                <div className="flex flex-col gap-1 pt-2">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <GripVertical className="h-4 w-4 rotate-90" />
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {index + 1}
                  </span>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === modules.length - 1}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <GripVertical className="h-4 w-4 -rotate-90" />
                  </button>
                </div>

                {/* Module content */}
                <div className="flex-1">
                  {editingIndex === index ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Headline
                        </label>
                        <input
                          type="text"
                          value={editedContent?.headline || ""}
                          onChange={(e) =>
                            setEditedContent({ ...editedContent!, headline: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="Module headline"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Body Text
                        </label>
                        <textarea
                          value={editedContent?.bodyText || ""}
                          onChange={(e) =>
                            setEditedContent({ ...editedContent!, bodyText: e.target.value })
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="Module body text"
                        />
                      </div>
                      {editedContent?.bullets && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Bullet Points
                          </label>
                          <textarea
                            value={editedContent.bullets.join("\n")}
                            onChange={(e) =>
                              setEditedContent({
                                ...editedContent!,
                                bullets: e.target.value.split("\n").filter((b) => b.trim()),
                              })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="One bullet point per line"
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(index)}
                          disabled={updateMutation.isPending}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {module.content.headline || `Module ${index + 1}`}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Type: {module.type}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(index)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {module.content.bodyText && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {module.content.bodyText}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

