"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createChatCompletion } from "@/lib/deepseek";
import { 
  getDailyTraining,
  saveDailyTraining,
  type TrainingItem,
  type DailyTraining,
  saveTrainingTemplate,
  getTrainingTemplates,
  deleteTrainingTemplate,
  TrainingTemplate
} from "@/lib/services/indexedDBService";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";

interface LanguageTrainingPlannerProps {
  languageId: string;
  languageName: string;
}

interface Activity {
  id: number;
  name: string;
  percentage: number;
  minutes: number;
  status: "Not Started" | "In Progress" | "Completed";
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AiRecommendation {
  activities: {
    id: number;
    name: string;
    percentage: number;
    minutes: number;
    explanation?: string;
  }[];
  totalPercentage: number;
  totalMinutes: number;
}

// Define activity IDs and names
const ACTIVITIES = {
  EXTENSIVE_READING: { id: 1, name: "泛读 (Extensive Reading)" },
  INTENSIVE_LISTENING: { id: 2, name: "精听 (Intensive Listening)" },
  TESTDAF_READING: { id: 3, name: "德福材料精读 (TestDaF Material Reading)" },
  DAILY_GERMAN: { id: 4, name: "每日德语听力口语 (Daily German Listening & Speaking)" },
  VOCAB_MEMORIZATION: { id: 5, name: "生词本背诵 (Vocabulary Memorization)" },
  SHADOWING: { id: 6, name: "影子跟读法 (Shadowing)" },
  EXTENSIVE_LISTENING: { id: 7, name: "泛听 (Extensive Listening)" },
  VOCAB_TEST: { id: 8, name: "词汇量测试 (Vocabulary Test)" },
  WRITING: { id: 9, name: "写作 (Writing)" },
  GRAMMAR: { id: 10, name: "语法 (Grammar)" },
  SPEAKING: { id: 11, name: "口语 (Speaking)" },
  READING: { id: 12, name: "阅读 (Reading)" },
  LISTENING: { id: 13, name: "听力 (Listening)" }
} as const;

const defaultTemplate: TrainingTemplate = {
  id: "default_template",
  name: "Default Template",
  activities: [
    { id: 12, name: "阅读 (Reading)", percentage: 20, minutes: 0, status: "Not Started" },
    { id: 13, name: "听力 (Listening)", percentage: 20, minutes: 0, status: "Not Started" },
    { id: 11, name: "口语 (Speaking)", percentage: 20, minutes: 0, status: "Not Started" },
    { id: 9, name: "写作 (Writing)", percentage: 20, minutes: 0, status: "Not Started" },
    { id: 10, name: "语法 (Grammar)", percentage: 20, minutes: 0, status: "Not Started" }
  ],
  language_id: "default",
  created_at: new Date().toISOString()
};

const germanTemplate: TrainingTemplate = {
  id: "german_template",
  name: "German Training Template",
  activities: [
    { id: 1, name: "泛读 (Extensive Reading)", percentage: 5, minutes: 0, status: "Not Started" },
    { id: 2, name: "精听 (Intensive Listening)", percentage: 30, minutes: 0, status: "Not Started" },
    { id: 3, name: "德福材料精读 (TestDaF Material Reading)", percentage: 20, minutes: 0, status: "Not Started" },
    { id: 4, name: "每日德语听力口语 (Daily German Listening & Speaking)", percentage: 15, minutes: 0, status: "Not Started" },
    { id: 5, name: "生词本背诵 (Vocabulary Memorization)", percentage: 10, minutes: 0, status: "Not Started" },
    { id: 6, name: "影子跟读法 (Shadowing)", percentage: 10, minutes: 0, status: "Not Started" },
    { id: 7, name: "泛听 (Extensive Listening)", percentage: 10, minutes: 0, status: "Not Started" },
    { id: 8, name: "词汇量测试 (Vocabulary Test)", percentage: 0, minutes: 0, status: "Not Started" }
  ],
  language_id: "de",
  created_at: new Date().toISOString()
};

// AI recommendation presets
const aiRecommendations = {
  beginner: {
    reading: 20,
    listening: 30,
    speaking: 25,
    writing: 15,
    grammar: 10
  },
  intermediate: {
    reading: 25,
    listening: 25,
    speaking: 20,
    writing: 20,
    grammar: 10
  },
  advanced: {
    reading: 30,
    listening: 20,
    speaking: 20,
    writing: 20,
    grammar: 10
  }
};

export function LanguageTrainingPlanner({ languageId, languageName }: LanguageTrainingPlannerProps) {
  const [totalMinutes, setTotalMinutes] = useState<number>(30);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customTemplates, setCustomTemplates] = useState<TrainingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [proficiencyLevel, setProficiencyLevel] = useState<string>("beginner");
  const [showAiRecommendation, setShowAiRecommendation] = useState(false);
  const [userContext, setUserContext] = useState<string>("");
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [activeTab, setActiveTab] = useState<"planner" | "templates">("planner");
  const [editingTemplate, setEditingTemplate] = useState<TrainingTemplate | null>(null);

  useEffect(() => {
    loadTrainingData();
    loadCustomTemplates();
  }, [languageId]);

  const loadTrainingData = async () => {
    try {
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading training data:", error);
      toast.error("Failed to load training data");
      setIsLoading(false);
    }
  };

  const loadCustomTemplates = async () => {
    try {
      const templates = await getTrainingTemplates(languageId);
      setCustomTemplates(templates);
    } catch (error) {
      console.error("Failed to load custom templates:", error);
      toast.error("Failed to load custom templates");
    }
  };

  const getAiRecommendation = async () => {
    if (!activities.length) {
      toast.error("Please select a template first");
      return;
    }

    setIsGeneratingRecommendation(true);
    try {
      const messages: Message[] = [
        {
          role: "system",
          content: `You are a language learning expert. Analyze the user's context and current training plan, then provide optimized percentages for each activity. 
            Return a JSON object with the following structure:
            {
              "activities": [
                {
                  "id": number,
                  "name": "activity name",
                  "percentage": number,
                  "minutes": number,
                  "explanation": "brief explanation"
                }
              ],
              "totalPercentage": 100,
              "totalMinutes": total_minutes
            }
            The totalPercentage must equal 100.
            
            Note: Use these exact activity IDs and names:
            ${Object.entries(ACTIVITIES).map(([key, value]) => 
              `- ID ${value.id}: "${value.name}"`
            ).join('\n')}`
        },
        {
          role: "user",
          content: `I am learning ${languageId} at ${proficiencyLevel} level. 
            My current activities are: ${activities.map(a => `ID ${a.id}: ${a.name}`).join(", ")}.
            I have ${totalMinutes} minutes available daily.
            Additional context: ${userContext || "No specific context provided."}
            Please provide recommendations in the specified JSON format.`
        }
      ];

      const response = await createChatCompletion(messages);
      
      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }

        const recommendations: AiRecommendation = JSON.parse(jsonMatch[1]);
        
        if (recommendations.totalPercentage !== 100) {
          throw new Error("Total percentage must be 100");
        }

        // Create a map of activity IDs to their recommendations
        const recommendationsMap = new Map(
          recommendations.activities.map(activity => [
            activity.id,
            activity
          ])
        );

        // Update activities with new percentages, setting missing activities to 0%
        const updatedActivities = activities.map(activity => {
          const recommendedActivity = recommendationsMap.get(activity.id);
          
          if (recommendedActivity) {
            return {
              ...activity,
              percentage: recommendedActivity.percentage,
              minutes: recommendedActivity.minutes
            };
          } else {
            // If activity is not in recommendations, set it to 0%
            return {
              ...activity,
              percentage: 0,
              minutes: 0
            };
          }
        });

        setActivities(updatedActivities);
        setShowAiRecommendation(true);
        toast.success("AI recommendations applied!");
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        toast.error("Could not parse AI recommendations");
      }
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
      toast.error("Failed to get AI recommendations");
    } finally {
      setIsGeneratingRecommendation(false);
    }
  };

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    let template: TrainingTemplate | undefined;
    
    if (templateName === "default") {
      template = defaultTemplate;
    } else if (templateName === "german") {
      template = germanTemplate;
    } else {
      template = customTemplates.find(t => t.id === templateName);
    }

    if (template) {
      const updatedActivities = template.activities.map(activity => ({
        ...activity,
        id: activity.id || ACTIVITIES[activity.name as keyof typeof ACTIVITIES]?.id || 0,
        minutes: Math.round((activity.percentage / 100) * totalMinutes)
      }));
      setActivities(updatedActivities);
    }
  };

  const handleTotalTimeChange = (minutes: number) => {
    setTotalMinutes(minutes);
    const updatedActivities = activities.map(activity => ({
      ...activity,
      minutes: Math.round((activity.percentage / 100) * minutes)
    }));
    setActivities(updatedActivities);
  };

  const handleActivityChange = (index: number, field: keyof Activity, value: string | number) => {
    const updatedActivities = [...activities];
    updatedActivities[index] = { 
      ...updatedActivities[index], 
      [field]: value,
      minutes: field === "percentage" ? Math.round((Number(value) / 100) * totalMinutes) : updatedActivities[index].minutes
    };
    setActivities(updatedActivities);
  };

  const handleSavePlan = async () => {
    if (activities.length === 0) {
      toast.error("Please add activities to your plan");
      return;
    }

    const totalPercentage = activities.reduce((sum, activity) => sum + activity.percentage, 0);
    if (totalPercentage !== 100) {
      toast.error("Total percentage must equal 100%");
      return;
    }

    try {
      const training: DailyTraining = {
        language_id: languageId,
        date: new Date().toISOString().split('T')[0],
        total_minutes: totalMinutes,
        items: activities.map(activity => ({
          language_id: languageId,
          date: new Date().toISOString().split('T')[0],
          item_name: activity.name,
          percentage: activity.percentage,
          minutes: activity.minutes,
          status: activity.status as "Not Started" | "In Progress" | "Completed",
          bookmarks: []
        }))
      };

      await saveDailyTraining(training);
      toast.success("Training plan saved successfully");
    } catch (error) {
      console.error("Error saving training plan:", error);
      toast.error("Failed to save training plan");
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (activities.length === 0) {
      toast.error("Please add at least one activity to save as template");
      return;
    }

    try {
      setIsLoading(true);
      await saveTrainingTemplate({
        name: newTemplateName,
        activities,
        language_id: languageId
      });
      toast.success("Template saved successfully");
      setShowTemplateModal(false);
      setNewTemplateName("");
      await loadCustomTemplates();
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      setIsLoading(true);
      await deleteTrainingTemplate(templateId);
      toast.success("Template deleted successfully");
      await loadCustomTemplates();
      if (selectedTemplate === templateId) {
        setSelectedTemplate("");
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddActivity = () => {
    const newId = Math.max(...activities.map(a => a.id), 0) + 1;
    setActivities([
      ...activities,
      {
        id: newId,
        name: "",
        percentage: 0,
        minutes: 0,
        status: "Not Started"
      }
    ]);
  };

  const handleRemoveActivity = (index: number) => {
    const newActivities = [...activities];
    newActivities.splice(index, 1);
    setActivities(newActivities);
  };

  const handleEditTemplate = (template: TrainingTemplate) => {
    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setActivities(template.activities);
    setShowTemplateModal(true);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !newTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    try {
      setIsLoading(true);
      await deleteTrainingTemplate(editingTemplate.id);
      await saveTrainingTemplate({
        name: newTemplateName,
        activities,
        language_id: languageId
      });
      toast.success("Template updated successfully");
      setShowTemplateModal(false);
      setNewTemplateName("");
      setEditingTemplate(null);
      await loadCustomTemplates();
    } catch (error) {
      console.error("Failed to update template:", error);
      toast.error("Failed to update template");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "planner"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("planner")}
        >
          Training Planner
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "templates"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("templates")}
        >
          Manage Templates
        </button>
      </div>

      {activeTab === "planner" ? (
        <Card>
          <CardHeader>
            <CardTitle>Training Planner</CardTitle>
            <CardDescription>Create and manage your language training schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalMinutes">Total Minutes</Label>
                <Input
                  id="totalMinutes"
                  type="number"
                  value={totalMinutes}
                  onChange={(e) => handleTotalTimeChange(Number(e.target.value))}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Template</SelectItem>
                    <SelectItem value="german">German Training Template</SelectItem>
                    {customTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proficiency">Proficiency Level</Label>
              <Select value={proficiencyLevel} onValueChange={setProficiencyLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Additional Context (Optional)</Label>
              <Textarea
                id="context"
                placeholder="Tell us about your learning goals, strengths, weaknesses, or any specific areas you want to focus on..."
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setShowTemplateModal(true)}
                disabled={activities.length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Template
              </Button>
              <Button
                variant="outline"
                onClick={getAiRecommendation}
                disabled={isGeneratingRecommendation}
              >
                {isGeneratingRecommendation ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Get AI Recommendation
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 items-center font-medium">
                <div className="col-span-1">Activity</div>
                <div className="col-span-1 text-right">Percentage</div>
                <div className="col-span-1 text-right">Minutes</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              {activities.map((activity, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 items-center">
                  <div className="col-span-1">
                    <Input
                      value={activity.name}
                      onChange={(e) => handleActivityChange(index, "name", e.target.value)}
                      placeholder="Activity name"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    <Input
                      type="number"
                      value={activity.percentage}
                      onChange={(e) => handleActivityChange(index, "percentage", Number(e.target.value))}
                      className="w-24"
                      min={0}
                      max={100}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <div className="col-span-1 text-right">
                    {Math.round((activity.percentage / 100) * totalMinutes)} min
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveActivity(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={handleAddActivity}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Activity
              </Button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Total: {activities.reduce((sum, activity) => sum + activity.percentage, 0)}%
              </div>
              <Button
                variant="outline"
                onClick={handleSavePlan}
              >
                Save Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Manage Templates</CardTitle>
            <CardDescription>View, edit, and delete your custom training templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {customTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {template.activities.length} activities
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {customTemplates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No custom templates yet. Create one in the Training Planner tab.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingTemplate ? "Edit Template" : "Save as Template"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTemplateModal(false);
                    setNewTemplateName("");
                    setEditingTemplate(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingTemplate ? handleUpdateTemplate : handleSaveAsTemplate}
                  disabled={isLoading || !newTemplateName.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {editingTemplate ? "Update" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 