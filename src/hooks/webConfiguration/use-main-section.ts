import { MultilingualSectionData } from "@/src/app/types/MultilingualSectionTypes";
import { useSectionItems } from "./use-section-items";

/**
 * Creates a main-service section item if it doesn't exist
 * @param ParentSectionId The parent section ID
 * @param sectionData The multilingual section data (for extracting title/description)
 * @returns Promise with the section item ID
 */
export async function createMainServiceItem(
  ParentSectionId: string,
  sectionData: MultilingualSectionData
): Promise<string> {
  // Get the section items hook
  const { 
    useGetBySectionId, 
    useCreate: useCreateSectionItem 
  } = useSectionItems();
  
  // Get section items for this section
  const sectionItemsQuery = useGetBySectionId(ParentSectionId);
  
  // Create mutation
  const createSectionItem = useCreateSectionItem();
  
  // Wait for query to complete
  await sectionItemsQuery.refetch();
  
  // Check if main-service already exists
  const existingMainService = sectionItemsQuery.data?.data?.find(
    (item: any) => item.name === "main-service"
  );
  
  // If main-service exists, return its ID
  if (existingMainService?._id) {
    console.log("Found existing main-service:", existingMainService._id);
    return existingMainService._id;
  }
  
  // Extract title and description from section data if available
  let title = "Main Service";
  let description = "Primary service offering";
  
  // Try to get title from first language in the data
  if (sectionData && sectionData.title && typeof sectionData.title === 'object') {
    const firstLangTitle = Object.values(sectionData.title)[0];
    if (firstLangTitle) {
      title = firstLangTitle;
    }
  }
  
  // Try to get description from first language in the data
  if (sectionData && sectionData.description && typeof sectionData.description === 'object') {
    const firstLangDesc = Object.values(sectionData.description)[0];
    if (firstLangDesc) {
      description = firstLangDesc;
    }
  }
  
  // Create the main-service section item
  try {
    console.log("Creating main-service for section:", ParentSectionId);
    
    const sectionItemData = {
      name: "main-service",
      description: description,
      section: ParentSectionId,
      isActive: true,
      order: 0,
      // Optional image from section data if available
      image: sectionData.imageUrl || null
    };
    
    const response = await createSectionItem.mutateAsync(sectionItemData);
    
    // Extract and return the new ID
    if (response && response.data && response.data._id) {
      console.log("Created main-service with ID:", response.data._id);
      return response.data._id;
    } else {
      throw new Error("Failed to extract ID from response");
    }
  } catch (error) {
    console.error("Error creating main-service:", error);
    throw error;
  }
}