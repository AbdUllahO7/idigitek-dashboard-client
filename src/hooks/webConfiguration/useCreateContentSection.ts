import { ContentElement, ContentTranslation, SubSection, Language } from '@/src/api/types';

import { useCallback } from 'react';
import { useSubSections } from './use-subSections';
import { useContentElements } from './use-conent-elements';
import { useContentTranslations } from './use-conent-translitions';
import { useLanguages } from './use-language';

// Helper functions for managing multilingual content sections

/**
 * Hook to create a new content section with translations for all languages
 */
export function useCreateContentSection() {
  const { useCreate: createSubSection } = useSubSections();
  const { useCreate: createElement } = useContentElements();
  const { useBulkUpsert: createTranslations } = useContentTranslations();
  const { useGetAll: getAllLanguages } = useLanguages();

  const createSubSectionMutation = createSubSection();
  const createElementMutation = createElement();
  const createTranslationsMutation = createTranslations();
  const { data: languages } = getAllLanguages();

  /**
   * Creates a subsection with content elements and translations for all languages
   */
  const createSection = useCallback(async ({
    sectionName,
    sectionSlug,
    sectionDescription = '',
    parentSections = [],
    contentData,
  }: {
    sectionName: string;
    sectionSlug: string;
    sectionDescription?: string;
    parentSections?: string[];
    contentData: {
      [languageId: string]: Array<{
        elementType: ContentElement['type'];
        name: string;
        content: string;
        metadata?: any;
      }>;
    };
  }) => {
    try {
      if (!languages) {
        throw new Error('Languages data not available');
      }

      // 1. Create the subsection
      const subsection = await createSubSectionMutation.mutateAsync({
        name: sectionName,
        slug: sectionSlug,
        description: sectionDescription,
        isActive: true,
        order: 0, // Will be updated by the backend
        parentSections: parentSections,
        languages: languages.map(lang => lang._id),
        metadata: {}
      });

      // Get the first language's content elements as reference
      const firstLangId = Object.keys(contentData)[0];
      const elementsToCreate = contentData[firstLangId].map((item, index) => ({
        name: item.name,
        type: item.elementType,
        defaultContent: '',
        isActive: true,
        metadata: item.metadata || {},
        order: index,
        parent: subsection._id
      }));

      // 2. Create content elements
      const createdElements = await Promise.all(
        elementsToCreate.map(element => 
          createElementMutation.mutateAsync(element)
        )
      );

      // 3. Create translations for all languages
      const translations: Array<Omit<ContentTranslation, '_id'>> = [];

      Object.entries(contentData).forEach(([langId, items]) => {
        items.forEach((item, index) => {
          translations.push({
            content: item.content,
            language: langId,
            contentElement: createdElements[index]._id,
            isActive: true,
            metadata: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });
      });

      // Bulk create all translations
      await createTranslationsMutation.mutateAsync(translations);

      return {
        subsection,
        elements: createdElements,
        success: true
      };
    } catch (error) {
      console.error('Error creating content section:', error);
      return {
        error,
        success: false
      };
    }
  }, [languages, createSubSectionMutation, createElementMutation, createTranslationsMutation]);

  return { createSection, isLoading: createSubSectionMutation.isPending };
}

/**
 * Hook to update an existing content section
 */
export function useUpdateContentSection() {
  const { useUpdate: updateSubSection } = useSubSections();
  const { useGetBySubsection: getElementsBySubsection, useUpdate: updateElement, useCreate: createElement } = useContentElements();
  const { useGetByElement: getTranslationsByElement, useBulkUpsert: upsertTranslations } = useContentTranslations();

  const updateSubSectionMutation = updateSubSection();
  const updateElementMutation = updateElement();
  const createElementMutation = createElement();
  const upsertTranslationsMutation = upsertTranslations();

  /**
   * Updates a subsection and its content with translations
   */
  const updateSection = useCallback(async ({
    subsectionId,
    sectionData,
    contentData,
  }: {
    subsectionId: string;
    sectionData?: Partial<SubSection>;
    contentData?: {
      [languageId: string]: Array<{
        elementId?: string; // Existing element ID if updating
        name: string;
        elementType: ContentElement['type'];
        content: string;
        metadata?: any;
      }>;
    };
  }) => {
    try {
      // 1. Update subsection if needed
      if (sectionData) {
        await updateSubSectionMutation.mutateAsync({
          id: subsectionId,
          data: sectionData
        });
      }

      // If no content updates, we're done
      if (!contentData) {
        return { success: true };
      }

      // 2. Get existing elements for this subsection
      const { data: existingElements } = getElementsBySubsection(subsectionId, true);
      
      if (!existingElements) {
        throw new Error('Failed to fetch existing elements');
      }

      // Take first language as reference for structure
      const firstLangId = Object.keys(contentData)[0];
      const contentItems = contentData[firstLangId];

      // Track elements that need to be created or updated
      const elementsToCreate: Omit<ContentElement, '_id'>[] = [];
      const elementsToUpdate: { id: string; data: Partial<ContentElement> }[] = [];
      
      // Map to store newly created elements and their corresponding index
      const elementMap = new Map<number, string>();

      // Process each content item
      await Promise.all(contentItems.map(async (item, index) => {
        if (item.elementId) {
          // Update existing element
          elementsToUpdate.push({
            id: item.elementId,
            data: {
              name: item.name,
              type: item.elementType,
              metadata: item.metadata || {},
              order: index
            }
          });
          elementMap.set(index, item.elementId);
        } else {
          // Create new element
          elementsToCreate.push({
            name: item.name,
            type: item.elementType,
            defaultContent: '',
            isActive: true,
            metadata: item.metadata || {},
            order: index,
            parent: subsectionId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }));

      // Create new elements
      const createdElements = await Promise.all(
        elementsToCreate.map(element => 
          createElementMutation.mutateAsync(element)
        )
      );
      
      // Update the element map with newly created elements
      createdElements.forEach((element, i) => {
        // Find the index where this element should be inserted
        const targetIndex = contentItems.findIndex(item => !item.elementId && !elementMap.has(contentItems.indexOf(item)));
        if (targetIndex !== -1) {
          elementMap.set(targetIndex, element._id);
        }
      });

      // Update existing elements
      await Promise.all(
        elementsToUpdate.map(({ id, data }) => 
          updateElementMutation.mutateAsync({ id, data })
        )
      );

      // 3. Create/update translations for all languages
      const translations: (Omit<ContentTranslation, '_id'> & { id?: string })[] = [];

      // Process translations for each language
      await Promise.all(Object.entries(contentData).map(async ([langId, items]) => {
        return Promise.all(items.map(async (item, index) => {
          const elementId = elementMap.get(index) || (item.elementId as string);
          
          if (!elementId) {
            throw new Error(`Could not find element ID for item at index ${index}`);
          }
          
          // Check if translation already exists
          if (item.elementId) {
            const { data: existingTranslations } = getTranslationsByElement(item.elementId);
            
            const existingTranslation = existingTranslations?.find(
              t => typeof t.language === 'string' 
                ? t.language === langId 
                : t.language._id === langId
            );

            if (existingTranslation) {
              translations.push({
                id: existingTranslation._id,
                content: item.content,
                language: langId,
                contentElement: elementId,
                isActive: true,
                metadata: existingTranslation.metadata,
                createdAt: existingTranslation.createdAt,
                updatedAt: new Date().toISOString()
              });
              return;
            }
          }
          
          // Create new translation
          translations.push({
            content: item.content,
            language: langId,
            contentElement: elementId,
            isActive: true,
            metadata: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }));
      }));

      // Bulk update/create translations
      await upsertTranslationsMutation.mutateAsync(translations);

      return { success: true };
    } catch (error) {
      console.error('Error updating content section:', error);
      return {
        error,
        success: false
      };
    }
  }, [
    updateSubSectionMutation, 
    getElementsBySubsection, 
    updateElementMutation, 
    createElementMutation, 
    getTranslationsByElement, 
    upsertTranslationsMutation
  ]);

  return { 
    updateSection, 
    isLoading: updateSubSectionMutation.isPending || 
               updateElementMutation.isPending || 
               createElementMutation.isPending || 
               upsertTranslationsMutation.isPending
  };
}

/**
 * Hook to load complete section data for editing
 */
export function useLoadContentSection() {
  const { useGetCompleteById } = useSubSections();
  
  /**
   * Transforms subsection data with content elements and translations
   * into a format suitable for form editing
   */
  const transformSectionData = useCallback((subsection: any) => {
    if (!subsection || !subsection.contentElements) {
      return { subsection: null, contentByLanguage: null };
    }

    const contentByLanguage: Record<string, any[]> = {};
    
    // Initialize content arrays for each language
    if (subsection.languages && Array.isArray(subsection.languages)) {
      subsection.languages.forEach((lang: any) => {
        const languageId = typeof lang === 'string' ? lang : lang._id;
        contentByLanguage[languageId] = [];
      });
    }

    // Organize elements and their translations by language
    subsection.contentElements.forEach((element: any) => {
      if (!element.translations || !Array.isArray(element.translations)) {
        return;
      }

      element.translations.forEach((translation: any) => {
        const languageId = typeof translation.language === 'string' 
          ? translation.language 
          : translation.language._id;
        
        if (!contentByLanguage[languageId]) {
          contentByLanguage[languageId] = [];
        }
        
        contentByLanguage[languageId].push({
          elementId: element._id,
          name: element.name,
          elementType: element.type,
          content: translation.content,
          metadata: element.metadata || {},
          order: element.order
        });
      });
    });

    // Sort content by element order
    Object.keys(contentByLanguage).forEach(langId => {
      contentByLanguage[langId].sort((a, b) => a.order - b.order);
    });

    return {
      subsection,
      contentByLanguage
    };
  }, []);

  /**
   * Loads a complete subsection with its content elements and translations
   */
  const loadSection = useCallback((subsectionId: string) => {
    const { data, isLoading, error } = useGetCompleteById(subsectionId, true);
    
    const transformedData = data ? transformSectionData(data) : null;
    
    return {
      data: transformedData,
      isLoading,
      error
    };
  }, [useGetCompleteById, transformSectionData]);

  return { loadSection };
}

/**
 * Custom hook to adapt content data to FAQ form format
 */
export function useFaqContentAdapter() {
  /**
   * Converts subsection content format to FAQ form format
   */
  const contentToFaqForm = useCallback((contentByLanguage: Record<string, any[]>) => {
    const faqFormData: Record<string, Array<{ question: string; answer: string }>> = {};
    
    Object.entries(contentByLanguage).forEach(([langId, items]) => {
      faqFormData[langId] = [];
      
      // Assume items are paired as question-answer
      for (let i = 0; i < items.length; i += 2) {
        if (i + 1 < items.length) {
          const question = items[i];
          const answer = items[i + 1];
          
          faqFormData[langId].push({
            question: question.content,
            answer: answer.content
          });
        }
      }
    });
    
    return faqFormData;
  }, []);
  
  /**
   * Converts FAQ form data to subsection content format
   */
  const faqFormToContent = useCallback((formData: Record<string, Array<{ question: string; answer: string }>>, subsectionId: string, existingContent?: Record<string, any[]>) => {
    const contentData: Record<string, any[]> = {};
    
    Object.entries(formData).forEach(([langId, faqs]) => {
      contentData[langId] = [];
      
      faqs.forEach((faq, faqIndex) => {
        // Map existing element IDs if available
        const existingQuestionElement = existingContent?.[langId]?.[faqIndex * 2];
        const existingAnswerElement = existingContent?.[langId]?.[faqIndex * 2 + 1];
        
        // Add question
        contentData[langId].push({
          elementId: existingQuestionElement?.elementId,
          name: `FAQ ${faqIndex + 1} Question`,
          elementType: 'heading' as ContentElement['type'],
          content: faq.question,
          metadata: { faqIndex, itemType: 'question' }
        });
        
        // Add answer
        contentData[langId].push({
          elementId: existingAnswerElement?.elementId,
          name: `FAQ ${faqIndex + 1} Answer`,
          elementType: 'paragraph' as ContentElement['type'],
          content: faq.answer,
          metadata: { faqIndex, itemType: 'answer' }
        });
      });
    });
    
    return contentData;
  }, []);
  
  return { contentToFaqForm, faqFormToContent };
}

/**
 * Custom hook to adapt content data to Benefits form format
 */
export function useBenefitsContentAdapter() {
  /**
   * Converts subsection content format to Benefits form format
   */
  const contentToBenefitsForm = useCallback((contentByLanguage: Record<string, any[]>) => {
    const benefitsFormData: Record<string, Array<{ icon: string; title: string; description: string }>> = {};
    
    Object.entries(contentByLanguage).forEach(([langId, items]) => {
      benefitsFormData[langId] = [];
      
      // Process items in groups of 3 (icon, title, description)
      for (let i = 0; i < items.length; i += 3) {
        if (i + 2 < items.length) {
          const icon = items[i];
          const title = items[i + 1];
          const description = items[i + 2];
          
          benefitsFormData[langId].push({
            icon: icon.content || 'Clock', // Default icon if not set
            title: title.content,
            description: description.content
          });
        }
      }
    });
    
    return benefitsFormData;
  }, []);
  
  /**
   * Converts Benefits form data to subsection content format
   */
  const benefitsFormToContent = useCallback((formData: Record<string, Array<{ icon: string; title: string; description: string }>>, subsectionId: string, existingContent?: Record<string, any[]>) => {
    const contentData: Record<string, any[]> = {};
    
    Object.entries(formData).forEach(([langId, benefits]) => {
      contentData[langId] = [];
      
      benefits.forEach((benefit, benefitIndex) => {
        // Map existing element IDs if available
        const existingIconElement = existingContent?.[langId]?.[benefitIndex * 3];
        const existingTitleElement = existingContent?.[langId]?.[benefitIndex * 3 + 1];
        const existingDescriptionElement = existingContent?.[langId]?.[benefitIndex * 3 + 2];
        
        // Add icon
        contentData[langId].push({
          elementId: existingIconElement?.elementId,
          name: `Benefit ${benefitIndex + 1} Icon`,
          elementType: 'custom' as ContentElement['type'],
          content: benefit.icon,
          metadata: { benefitIndex, itemType: 'icon' }
        });
        
        // Add title
        contentData[langId].push({
          elementId: existingTitleElement?.elementId,
          name: `Benefit ${benefitIndex + 1} Title`,
          elementType: 'heading' as ContentElement['type'],
          content: benefit.title,
          metadata: { benefitIndex, itemType: 'title' }
        });
        
        // Add description
        contentData[langId].push({
          elementId: existingDescriptionElement?.elementId,
          name: `Benefit ${benefitIndex + 1} Description`,
          elementType: 'paragraph' as ContentElement['type'],
          content: benefit.description,
          metadata: { benefitIndex, itemType: 'description' }
        });
      });
    });
    
    return contentData;
  }, []);
  
  return { contentToBenefitsForm, benefitsFormToContent };
}

/**
 * Example usage for FAQ section management
 */
export function useFaqSectionManager() {
  const { createSection } = useCreateContentSection();
  const { updateSection } = useUpdateContentSection();
  const { loadSection } = useLoadContentSection();
  const { contentToFaqForm, faqFormToContent } = useFaqContentAdapter();
  
  /**
   * Creates a new FAQ section
   */
  const createFaqSection = async (
    sectionName: string, 
    sectionSlug: string, 
    faqData: Record<string, Array<{ question: string; answer: string }>>
  ) => {
    const contentData = faqFormToContent(faqData, '');
    return createSection({
      sectionName,
      sectionSlug,
      sectionDescription: 'Frequently Asked Questions',
      contentData
    });
  };
  
  /**
   * Updates an existing FAQ section
   */
  const updateFaqSection = async (
    subsectionId: string,
    faqData: Record<string, Array<{ question: string; answer: string }>>
  ) => {
    // Load existing data to map element IDs
    const { data } = loadSection(subsectionId);
    
    if (!data) {
      throw new Error('Failed to load existing section data');
    }
    
    const contentData = faqFormToContent(faqData, subsectionId, data.contentByLanguage);
    
    return updateSection({
      subsectionId,
      contentData
    });
  };
  
  /**
   * Loads an existing FAQ section for editing
   */
  const loadFaqSection = (subsectionId: string) => {
    const result = loadSection(subsectionId);
    
    if (result.data?.contentByLanguage) {
      const faqFormData = contentToFaqForm(result.data.contentByLanguage);
      return {
        ...result,
        formData: faqFormData
      };
    }
    
    return {
      ...result,
      formData: null
    };
  };
  
  return {
    createFaqSection,
    updateFaqSection,
    loadFaqSection
  };
}

/**
 * Example usage for Benefits section management
 */
export function useBenefitsSectionManager() {
  const { createSection } = useCreateContentSection();
  const { updateSection } = useUpdateContentSection();
  const { loadSection } = useLoadContentSection();
  const { contentToBenefitsForm, benefitsFormToContent } = useBenefitsContentAdapter();
  
  /**
   * Creates a new Benefits section
   */
  const createBenefitsSection = async (
    sectionName: string, 
    sectionSlug: string, 
    benefitsData: Record<string, Array<{ icon: string; title: string; description: string }>>
  ) => {
    const contentData = benefitsFormToContent(benefitsData, '');
    return createSection({
      sectionName,
      sectionSlug,
      sectionDescription: 'Benefits Section',
      contentData
    });
  };
  
  /**
   * Updates an existing Benefits section
   */
  const updateBenefitsSection = async (
    subsectionId: string,
    benefitsData: Record<string, Array<{ icon: string; title: string; description: string }>>
  ) => {
    // Load existing data to map element IDs
    const { data } = loadSection(subsectionId);
    
    if (!data) {
      throw new Error('Failed to load existing section data');
    }
    
    const contentData = benefitsFormToContent(benefitsData, subsectionId, data.contentByLanguage);
    
    return updateSection({
      subsectionId,
      contentData
    });
  };
  
  /**
   * Loads an existing Benefits section for editing
   */
  const loadBenefitsSection = (subsectionId: string) => {
    const result = loadSection(subsectionId);
    
    if (result.data?.contentByLanguage) {
      const benefitsFormData = contentToBenefitsForm(result.data.contentByLanguage);
      return {
        ...result,
        formData: benefitsFormData
      };
    }
    
    return {
      ...result,
      formData: null
    };
  };
  
  return {
    createBenefitsSection,
    updateBenefitsSection,
    loadBenefitsSection
  };
}

/**
 * Helper function to prepare content for preview components
 */
export function prepareContentForPreview(content: any, preferredLanguage: string = 'en') {
  if (!content || !content.contentElements || !Array.isArray(content.contentElements)) {
    return null;
  }

  // Get all available languages in the content
  const availableLanguages = new Set<string>();
  content.contentElements.forEach((element: any) => {
    if (element.translations && Array.isArray(element.translations)) {
      element.translations.forEach((translation: any) => {
        const langId = typeof translation.language === 'string'
          ? translation.language
          : translation.language?._id;
        
        if (langId) {
          availableLanguages.add(langId);
        }
      });
    }
  });

  // Use preferred language if available, otherwise use the first available language
  const languagesToUse = availableLanguages.has(preferredLanguage)
    ? [preferredLanguage]
    : Array.from(availableLanguages).slice(0, 1);

  if (languagesToUse.length === 0) {
    return null; // No languages available
  }

  // Sort elements by order
  const sortedElements = [...content.contentElements].sort((a: any, b: any) => a.order - b.order);

  // Get section type from name or metadata
  const sectionType = getSectionTypeFromContent(content);

  // Process the elements according to section type
  if (sectionType === 'faq') {
    return prepareFaqPreview(sortedElements, languagesToUse[0]);
  } else if (sectionType === 'benefits') {
    return prepareBenefitsPreview(sortedElements, languagesToUse[0]);
  } else {
    return prepareGenericPreview(sortedElements, languagesToUse[0]);
  }
}

/**
 * Determine section type from content
 */
export function getSectionTypeFromContent(content: any): 'faq' | 'benefits' | 'generic' {
  if (!content) return 'generic';

  // Check metadata first
  if (content.metadata?.type === 'faq') return 'faq';
  if (content.metadata?.type === 'benefits') return 'benefits';

  // Check by name
  const name = (content.name || '').toLowerCase();
  if (name.includes('faq') || name.includes('question')) return 'faq';
  if (name.includes('benefit')) return 'benefits';

  // Check by content structure pattern
  if (content.contentElements && Array.isArray(content.contentElements)) {
    // FAQ pattern: alternating heading + paragraph
    let isFaqPattern = true;
    for (let i = 0; i < content.contentElements.length; i += 2) {
      if (i + 1 >= content.contentElements.length) break;
      
      const firstElement = content.contentElements[i];
      const secondElement = content.contentElements[i + 1];
      
      if (firstElement.type !== 'heading' || secondElement.type !== 'paragraph') {
        isFaqPattern = false;
        break;
      }
      
      if (firstElement.metadata?.itemType === 'question' && 
          secondElement.metadata?.itemType === 'answer') {
        return 'faq'; // Strong indicator of FAQ
      }
    }
    
    if (isFaqPattern) return 'faq';
    
    // Benefits pattern: grouped by triplets (icon, heading, paragraph)
    let isBenefitsPattern = true;
    for (let i = 0; i < content.contentElements.length; i += 3) {
      if (i + 2 >= content.contentElements.length) break;
      
      const iconElement = content.contentElements[i];
      const titleElement = content.contentElements[i + 1];
      const descElement = content.contentElements[i + 2];
      
      if (iconElement.type !== 'custom' || 
          titleElement.type !== 'heading' || 
          descElement.type !== 'paragraph') {
        isBenefitsPattern = false;
        break;
      }
      
      if (iconElement.metadata?.itemType === 'icon' && 
          titleElement.metadata?.itemType === 'title' &&
          descElement.metadata?.itemType === 'description') {
        return 'benefits'; // Strong indicator of benefits
      }
    }
    
    if (isBenefitsPattern) return 'benefits';
  }
  
  return 'generic';
}

/**
 * Prepare FAQ content for preview
 */
function prepareFaqPreview(elements: any[], languageId: string) {
  const faqs: Array<{ question: string; answer: string }> = [];
  
  for (let i = 0; i < elements.length; i += 2) {
    if (i + 1 >= elements.length) break;
    
    const questionElement = elements[i];
    const answerElement = elements[i + 1];
    
    // Find translations for the current language
    const questionTranslation = findTranslationByLanguage(questionElement, languageId);
    const answerTranslation = findTranslationByLanguage(answerElement, languageId);
    
    if (questionTranslation && answerTranslation) {
      faqs.push({
        question: questionTranslation.content,
        answer: answerTranslation.content
      });
    }
  }
  
  return {
    type: 'faq',
    items: faqs
  };
}

/**
 * Prepare Benefits content for preview
 */
function prepareBenefitsPreview(elements: any[], languageId: string) {
  const benefits: Array<{ icon: string; title: string; description: string }> = [];
  
  for (let i = 0; i < elements.length; i += 3) {
    if (i + 2 >= elements.length) break;
    
    const iconElement = elements[i];
    const titleElement = elements[i + 1];
    const descElement = elements[i + 2];
    
    // Find translations for the current language
    const iconTranslation = findTranslationByLanguage(iconElement, languageId);
    const titleTranslation = findTranslationByLanguage(titleElement, languageId);
    const descTranslation = findTranslationByLanguage(descElement, languageId);
    
    if (iconTranslation && titleTranslation && descTranslation) {
      benefits.push({
        icon: iconTranslation.content,
        title: titleTranslation.content,
        description: descTranslation.content
      });
    }
  }
  
  return {
    type: 'benefits',
    items: benefits
  };
}

/**
 * Prepare generic content for preview
 */
function prepareGenericPreview(elements: any[], languageId: string) {
  const items = elements.map(element => {
    const translation = findTranslationByLanguage(element, languageId);
    
    return {
      type: element.type,
      content: translation ? translation.content : '',
      metadata: element.metadata || {}
    };
  });
  
  return {
    type: 'generic',
    items
  };
}

/**
 * Find translation for a specific language
 */
function findTranslationByLanguage(element: any, languageId: string) {
  if (!element || !element.translations || !Array.isArray(element.translations)) {
    return null;
  }
  
  return element.translations.find((translation: any) => {
    const translationLangId = typeof translation.language === 'string'
      ? translation.language
      : translation.language?._id;
    
    return translationLangId === languageId;
  });
}