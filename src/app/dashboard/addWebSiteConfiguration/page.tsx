"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Globe, 
  LayoutGrid, 
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw
} from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { useToast } from "@/src/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/src/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { ImageUpload } from "@/src/lib/ImageUploader"
import { Section, useSections } from "@/src/hooks/webConfiguration/use-sectioın"
import { Language, useLanguages } from "@/src/hooks/webConfiguration/use-language"

// Define TypeScript interfaces for our edit and delete operations
interface EditItemData {
  _id?: string;
  id?: string;
  name?: string;
  languageID?: string;
  language?: string;
  section_name?: string;
  image?: string;
  imageUrl?: string;
  description?: string;
  type: "language" | "section";
  originalId?: string;
  subSections?: string[] | any[];
}

interface DeleteItemData {
  _id?: string;
  id?: string;
  name?: string;
  language?: string;
  languageID?: string;
  section_name?: string;
  image?: string;
  type: "language" | "section";
  subSections?: string[] | any[];
}


interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: {
    count: number;
    data: T[];
  };
  timestamp: string;
  requestId: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: {
    count: number;
    data: T[];
  };
  timestamp: string;
  requestId: string;
}


export default function AdminManagementPage() {
  // Get our custom hooks
  const { 
    useGetAll: useGetAllLanguages,
    useCreate: useCreateLanguage,
    useUpdate: useUpdateLanguage,
    useDelete: useDeleteLanguage
  } = useLanguages();
  
  const { 
    useGetAll: useGetAllSections,
    useCreate: useCreateSection,
    useUpdate: useUpdateSection,
    useDelete: useDeleteSection
  } = useSections();

  // Use React Query hooks
  const { 
    data: languagesData, 
    isLoading: isLoadingLanguages,
    error: languagesError,
    refetch: refetchLanguages
  } = useGetAllLanguages();
  
  const { 
    data: sectionsData, 
    isLoading: isLoadingSections,
    error: sectionsError,
    refetch: refetchSections
  } = useGetAllSections();

  // Extract actual data from the response
  // Server response structure: { success: true, data: { count: number, data: Language[] }}
  const extractLanguages = (): Language[] => {
    if (!languagesData) return [];
    
    // If the data is already an array, use it
    if (Array.isArray(languagesData)) return languagesData;
    
    // If data is an ApiResponse type
    if (
      typeof languagesData === 'object' && 
      languagesData !== null && 
      'data' in languagesData && 
      languagesData.data && 
      'data' in languagesData.data && 
      Array.isArray(languagesData.data.data)
    ) {
      return languagesData.data.data;
    }
    
    // Fallback to empty array
    return [];
  };
  
  const extractSections = (): Section[] => {
    if (!sectionsData) return [];
    
    // If the data is already an array, use it
    if (Array.isArray(sectionsData)) return sectionsData;
    
    // If data is an ApiResponse type
    if (
      typeof sectionsData === 'object' && 
      sectionsData !== null && 
      'data' in sectionsData && 
      sectionsData.data && 
      'data' in sectionsData.data && 
      Array.isArray(sectionsData.data.data)
    ) {
      return sectionsData.data.data;
    }
    
    // Fallback to empty array
    return [];
  };

  // Get the languages and sections arrays
  const languages = extractLanguages();
  const sections = extractSections();



  // Mutations for languages
  const createLanguageMutation = useCreateLanguage();
  const updateLanguageMutation = useUpdateLanguage();
  const deleteLanguageMutation = useDeleteLanguage();

  // Mutations for sections
  const createSectionMutation = useCreateSection();
  const updateSectionMutation = useUpdateSection();
  const deleteSectionMutation = useDeleteSection();

  const [newLanguage, setNewLanguage] = useState<Language>({ 
    languageID: "", 
    language: "", 
    subSections: [] 
  });
  
  const [newSection, setNewSection] = useState<Section>({ 
    section_name: "", 
    description: "", 
    image: "",
    isActive: true,
    order: 0,
    subSections: []
  });
  
  const [editItem, setEditItem] = useState<EditItemData | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DeleteItemData | null>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("languages");
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  // Function to handle refetching data
  const handleRefetch = async () => {
    setIsRefetching(true);
    try {
      await Promise.all([refetchLanguages(), refetchSections()]);
      toast({
        title: "Data refreshed",
        description: "The latest data has been loaded.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefetching(false);
    }
  };

  // Effect to handle mutations completion
  useEffect(() => {
    // When any mutation completes successfully, refetch the data
    const isLanguageMutationSuccess = 
      createLanguageMutation.isSuccess || 
      updateLanguageMutation.isSuccess || 
      deleteLanguageMutation.isSuccess;
    
    const isSectionMutationSuccess = 
      createSectionMutation.isSuccess || 
      updateSectionMutation.isSuccess || 
      deleteSectionMutation.isSuccess;
    
    if (isLanguageMutationSuccess) {
      refetchLanguages();
    }
    
    if (isSectionMutationSuccess) {
      refetchSections();
    }
  }, [
    createLanguageMutation.isSuccess, 
    updateLanguageMutation.isSuccess, 
    deleteLanguageMutation.isSuccess,
    createSectionMutation.isSuccess,
    updateSectionMutation.isSuccess,
    deleteSectionMutation.isSuccess,
    refetchLanguages,
    refetchSections
  ]);

  const handleAddLanguage = () => {
    if (!newLanguage.languageID || !newLanguage.language) {
      toast({
        title: "Invalid input",
        description: "Please enter both ID and name for the language.",
        variant: "destructive",
      });
      return;
    }

    if (languages.some((lang) => lang.languageID === newLanguage.languageID)) {
      toast({
        title: "Duplicate ID",
        description: "A language with this ID already exists.",
        variant: "destructive",
      });
      return;
    }

    createLanguageMutation.mutate(newLanguage, {
      onSuccess: () => {
        setNewLanguage({ languageID: "", language: "", subSections: [] });
        
        toast({
          title: "Language added",
          description: `${newLanguage.language} has been added successfully.`,
        });
        
        showSuccessMessage();
      },
      onError: (error) => {
        toast({
          title: "Error adding language",
          description: error.message || "An error occurred while adding the language.",
          variant: "destructive",
        });
      }
    });
  };

  const handleAddSection = () => {
    if (!newSection.section_name) {
      toast({
        title: "Invalid input",
        description: "Please enter a name for the section.",
        variant: "destructive",
      });
      return;
    }

    if (sections.some((section) => section.section_name === newSection.section_name)) {
      toast({
        title: "Duplicate name",
        description: "A section with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    createSectionMutation.mutate(newSection, {
      onSuccess: () => {
        setNewSection({ 
          section_name: "", 
          description: "", 
          image: "",
          isActive: true,
          order: 0,
          subSections: []
        });
        
        toast({
          title: "Section added",
          description: `${newSection.section_name} has been added successfully.`,
        });
        
        showSuccessMessage();
      },
      onError: (error) => {
        toast({
          title: "Error adding section",
          description: error.message || "An error occurred while adding the section.",
          variant: "destructive",
        });
      }
    });
  };

  const handleEdit = (item: Language | Section, type: "language" | "section") => {
    if (type === "language") {
      const language = item as Language;
      setEditItem({ 
        _id: language._id,
        languageID: language.languageID,
        language: language.language,
        type: "language"
      });
    } else {
      const section = item as Section;
      setEditItem({ 
        _id: section._id,
        section_name: section.section_name,
        image: section.image,
        description: section.description,
        type: "section"
      });
    }
  };

  const handleSaveEdit = () => {
    if (!editItem || !editItem._id) {
      toast({
        title: "Invalid input",
        description: "Missing required fields for update.",
        variant: "destructive",
      });
      return;
    }

    if (editItem.type === "language") {
      if (!editItem.languageID || !editItem.language) {
        toast({
          title: "Invalid input",
          description: "Please enter both ID and name for the language.",
          variant: "destructive",
        });
        return;
      }

      // Check for duplicate ID only if ID was changed
      const originalItem = languages.find(item => item._id === editItem._id);
      if (originalItem && editItem.languageID !== originalItem.languageID && 
          languages.some(item => item.languageID === editItem.languageID)) {
        toast({
          title: "Duplicate ID",
          description: "A language with this ID already exists.",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for update
      const updateData = {
        id: editItem._id,
        data: {
          languageID: editItem.languageID,
          language: editItem.language
        }
      };

      updateLanguageMutation.mutate(updateData, {
        onSuccess: () => {
          setEditItem(null);
          
          toast({
            title: "Language updated",
            description: "The language has been updated successfully.",
          });
          
          showSuccessMessage();
        },
        onError: (error) => {
          toast({
            title: "Error updating language",
            description: error.message || "An error occurred while updating the language.",
            variant: "destructive",
          });
        }
      });
    } else {
      if (!editItem.section_name) {
        toast({
          title: "Invalid input",
          description: "Please enter a name for the section.",
          variant: "destructive",
        });
        return;
      }

      // Check for duplicate name only if name was changed
      const originalItem = sections.find(item => item._id === editItem._id);
      if (originalItem && editItem.section_name !== originalItem.section_name && 
          sections.some(item => item.section_name === editItem.section_name)) {
        toast({
          title: "Duplicate name",
          description: "A section with this name already exists.",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for update
      const updateData = {
        id: editItem._id,
        data: {
          section_name: editItem.section_name,
          description: editItem.description,
          image: editItem.image
        }
      };

      updateSectionMutation.mutate(updateData, {
        onSuccess: () => {
          setEditItem(null);
          
          toast({
            title: "Section updated",
            description: "The section has been updated successfully.",
          });
          
          showSuccessMessage();
        },
        onError: (error) => {
          toast({
            title: "Error updating section",
            description: error.message || "An error occurred while updating the section.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete && itemToDelete._id) {
      if (itemToDelete.type === "language") {
        deleteLanguageMutation.mutate(itemToDelete._id, {
          onSuccess: () => {
            toast({
              title: "Language deleted",
              description: `The language has been deleted successfully.`,
            });
            
            setItemToDelete(null);
            showSuccessMessage();
          },
          onError: (error) => {
            toast({
              title: "Error deleting language",
              description: error.message || "An error occurred while deleting the language.",
              variant: "destructive",
            });
          }
        });
      } else {
        deleteSectionMutation.mutate(itemToDelete._id, {
          onSuccess: () => {
            toast({
              title: "Section deleted",
              description: `The section has been deleted successfully.`,
            });
            
            setItemToDelete(null);
            showSuccessMessage();
          },
          onError: (error) => {
            toast({
              title: "Error deleting section",
              description: error.message || "An error occurred while deleting the section.",
              variant: "destructive",
            });
          }
        });
      }
    }
  };

  const showSuccessMessage = () => {
    setShowSavedSuccess(true);
    setTimeout(() => {
      setShowSavedSuccess(false);
    }, 3000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  // Loading and error states
  if (isLoadingLanguages || isLoadingSections) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading content...</p>
        </div>
      </div>
    );
  }

  if (languagesError || sectionsError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 dark:text-slate-300">
              {languagesError?.message || sectionsError?.message || "Failed to load data. Please try refreshing the page."}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={handleRefetch} 
              className="w-full flex items-center gap-2"
              disabled={isRefetching}
            >
              {isRefetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Data
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-purple-500/10 to-transparent dark:from-purple-900/20" />
      </div>

      {/* Success notification */}
      <AnimatePresence>
        {showSavedSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg shadow-md flex items-center gap-2"
          >
            <Check className="h-5 w-5" />
            <span>Changes saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicators for mutations */}
      <AnimatePresence>
        {(createLanguageMutation.isPending || updateLanguageMutation.isPending || deleteLanguageMutation.isPending || 
          createSectionMutation.isPending || updateSectionMutation.isPending || deleteSectionMutation.isPending) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-4 z-50 bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg shadow-md flex items-center gap-2"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Saving changes...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col items-center space-y-4">
      
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl text-center"
          >
            Website Content Manager
          </motion.h1>
          
          <motion.p 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl text-center"
          >
            Add, edit, or remove languages and sections for your website configuration
          </motion.p>

          {/* Refresh Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefetch}
              disabled={isRefetching}
              className="flex items-center gap-2"
            >
              {isRefetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Data
            </Button>
          </motion.div>
        </div>

        <Tabs 
          defaultValue="languages" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-6"
          >
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="languages" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Languages ({languages.length})
              </TabsTrigger>
              <TabsTrigger value="sections" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Sections ({sections.length})
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <TabsContent value="languages">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Add New Language
                  </CardTitle>
                  <CardDescription>
                    Enter the details for a new language to support on your website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-language-id">Language ID (code)</Label>
                      <Input
                        id="new-language-id"
                        placeholder="e.g. en, fr, es"
                        value={newLanguage.languageID}
                        onChange={(e) => setNewLanguage({ ...newLanguage, languageID: e.target.value.toLowerCase() })}
                        className="w-full"
                      />
                      <p className="text-xs text-slate-500">
                        Use a standard language code (e.g., "en" for English)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-language-name">Language Name</Label>
                      <Input
                        id="new-language-name"
                        placeholder="e.g. English, French"
                        value={newLanguage.language}
                        onChange={(e) => setNewLanguage({ ...newLanguage, language: e.target.value })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={handleAddLanguage} 
                    className="flex items-center gap-2"
                    disabled={createLanguageMutation.isPending}
                  >
                    {createLanguageMutation.isPending ? 
                      <Loader2 className="h-4 w-4 animate-spin" /> : 
                      <Plus className="h-4 w-4" />
                    }
                    Add Language
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Manage Languages
                  </CardTitle>
                  <CardDescription>
                    Edit or remove existing languages ({languages.length} total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {languages.length > 0 ? (
                    <motion.div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3" variants={containerVariants}>
                      {languages.map((language) => (
                        <motion.div key={language._id || `lang-${language.languageID}`} variants={itemVariants}>
                          <Card className="border border-slate-200 dark:border-slate-700">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{language.language}</p>
                                  <p className="text-sm text-slate-500">ID: {language.languageID}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(language, "language")}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Language</DialogTitle>
                                        <DialogDescription>
                                          Make changes to the language details below.
                                        </DialogDescription>
                                      </DialogHeader>
                                      {editItem && editItem.type === "language" && (
                                        <div className="grid gap-4 py-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-language-id">Language ID</Label>
                                            <Input
                                              id="edit-language-id"
                                              value={editItem.languageID}
                                              onChange={(e) => 
                                                setEditItem({ 
                                                  ...editItem, 
                                                  languageID: e.target.value.toLowerCase()
                                                })
                                              }
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-language-name">Language Name</Label>
                                            <Input
                                              id="edit-language-name"
                                              value={editItem.language}
                                              onChange={(e) => setEditItem({ ...editItem, language: e.target.value })}
                                            />
                                          </div>
                                        </div>
                                      )}
                                      <DialogFooter>
                                        <DialogClose asChild>
                                          <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                          <Button 
                                            onClick={handleSaveEdit} 
                                            disabled={updateLanguageMutation.isPending}
                                          >
                                            {updateLanguageMutation.isPending ? 
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                                              <Save className="h-4 w-4 mr-2" />
                                            }
                                            Save Changes
                                          </Button>
                                        </DialogClose>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={() => setItemToDelete({ ...language, type: "language" })}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Language</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete &quot;{language.language}&quot;? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={confirmDelete}
                                          className="bg-red-500 hover:bg-red-600"
                                          disabled={deleteLanguageMutation.isPending}
                                        >
                                          {deleteLanguageMutation.isPending ? 
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                                            null
                                          }
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                      <p>No languages found. Add your first language above.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="sections">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Add New Section
                  </CardTitle>
                  <CardDescription>
                    Enter the details for a new website section
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-section-name">Section Name</Label>
                        <Input
                          id="new-section-name"
                          placeholder="e.g. Hero, Features"
                          value={newSection.section_name}
                          onChange={(e) => setNewSection({ ...newSection, section_name: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-section-description">Description</Label>
                        <Input
                          id="new-section-description"
                          placeholder="Brief description of this section"
                          value={newSection.description || ""}
                          onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Section Image</Label>
                      <ImageUpload
                        value={newSection.image} 
                        onChange={(url) => setNewSection({ ...newSection, image: url })} 
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Add an image for this section (optional)
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={handleAddSection} 
                    className="flex items-center gap-2"
                    disabled={createSectionMutation.isPending}
                  >
                    {createSectionMutation.isPending ? 
                      <Loader2 className="h-4 w-4 animate-spin" /> : 
                      <Plus className="h-4 w-4" />
                    }
                    Add Section
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Manage Sections
                  </CardTitle>
                  <CardDescription>
                    Edit or remove existing sections ({sections.length} total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sections.length > 0 ? (
                    <motion.div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3" variants={containerVariants}>
                      {sections.map((section) => (
                        <motion.div key={section._id || `section-${section.section_name}`} variants={itemVariants}>
                          <Card className="border border-slate-200 dark:border-slate-700">
                            <CardContent className="p-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{section.section_name}</p>
                                    {section.description && (
                                      <p className="text-sm text-slate-500">{section.description}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(section, "section")}>
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Edit Section</DialogTitle>
                                          <DialogDescription>
                                            Make changes to the section details below.
                                          </DialogDescription>
                                        </DialogHeader>
                                        {editItem && editItem.type === "section" && (
                                          <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-section-name">Section Name</Label>
                                              <Input
                                                id="edit-section-name"
                                                value={editItem.section_name || ""}
                                                onChange={(e) => 
                                                  setEditItem({ 
                                                    ...editItem, 
                                                    section_name: e.target.value
                                                  })
                                                }
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-section-description">Description</Label>
                                              <Input
                                                id="edit-section-description"
                                                value={editItem.description || ""}
                                                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Section Image</Label>
                                              <ImageUpload
                                                value={editItem.image || ""} 
                                                onChange={(url) => setEditItem({ ...editItem, image: url })} 
                                              />
                                            </div>
                                          </div>
                                        )}
                                        <DialogFooter>
                                          <DialogClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                          </DialogClose>
                                          <DialogClose asChild>
                                            <Button 
                                              onClick={handleSaveEdit}
                                              disabled={updateSectionMutation.isPending}
                                            >
                                              {updateSectionMutation.isPending ? 
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                                                <Save className="h-4 w-4 mr-2" />
                                              }
                                              Save Changes
                                            </Button>
                                          </DialogClose>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                          onClick={() => setItemToDelete({ ...section, type: "section" })}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Section</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete &quot;{section.section_name}&quot;? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={confirmDelete}
                                            className="bg-red-500 hover:bg-red-600"
                                            disabled={deleteSectionMutation.isPending}
                                          >
                                            {deleteSectionMutation.isPending ? 
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                                              null
                                            }
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                                
                                {/* Show image thumbnail if available */}
                                {section.image && (
                                  <div className="mt-2 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <Image 
                                      src={section.image} 
                                      alt={section.section_name}
                                      width={300}
                                      height={100}
                                      className="w-full h-20 object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                      <p>No sections found. Add your first section above.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        <motion.div 
          variants={fadeIn}
          initial="hidden" 
          animate="visible"
          className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8"
        >
          <p>Manage the languages and sections available for website configuration.</p>
          <p className="mt-1">These settings will be used across your website building process.</p>
        </motion.div>
      </div>
    </main>
  )
}