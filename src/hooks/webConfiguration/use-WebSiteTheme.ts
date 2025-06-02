// src/hooks/webConfiguration/use-WebSiteTheme.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/src/lib/api-client';
import { useAuth } from '@/src/context/AuthContext'; // Import your auth context if available
import { CreateWebSiteThemeDto, UpdateWebSiteThemeDto, WebSiteTheme } from '@/src/api/types/hooks/useWebSiteTheme';

// WebSite Theme hook
export function useWebSiteThemes() {
  const queryClient = useQueryClient();
  const endpoint = '/themes';

  // Get current user ID from auth context to include in query keys (if available)
  const { user } = useAuth?.() || { user: { id: 'anonymous' } };
  const userId = user?.id || 'anonymous';

  // Query keys include user ID to prevent cross-user cache conflicts
  const themesKey = ['themes', userId];
  const themeKey = (id: string) => [...themesKey, id];
  const websiteThemesKey = (websiteId: string) => [...themesKey, 'website', websiteId];
  const activeThemeKey = (websiteId: string) => [...themesKey, 'website', websiteId, 'active'];

  // Get all themes (admin function - paginated)
  const useGetAll = (options?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();

    if (options?.page) {
      queryParams.append('page', options.page.toString());
    }

    if (options?.limit) {
      queryParams.append('limit', options.limit.toString());
    }

    // Create a unique query key based on pagination
    const queryKey = options
      ? [...themesKey, 'all', JSON.stringify(options)]
      : [...themesKey, 'all'];

    return useQuery({
      queryKey,
      queryFn: async () => {
        const url = queryParams.toString()
          ? `${endpoint}/admin/all?${queryParams.toString()}`
          : `${endpoint}/admin/all`;
        const { data } = await apiClient.get(url);
        return data.data; // Backend wraps response in { success, message, data }
      },
      staleTime: 30 * 1000, // 30 seconds
    });
  };

// Get all themes for a specific website
  const useGetByWebsite = (websiteId: string) => {
    return useQuery({
      queryKey: websiteThemesKey(websiteId),
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/website/${websiteId}`);
        return data; // Backend returns { success, message, data: WebSiteTheme[] }
      },
      enabled: !!websiteId,
      staleTime: 30 * 1000,
    });
  };

  // Get active theme for a specific website
  const useGetActiveTheme = (websiteId: string) => {
    return useQuery({
      queryKey: activeThemeKey(websiteId),
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/active/${websiteId}`);
        return data; // Backend returns { success, message, data: WebSiteTheme }
      },
      enabled: !!websiteId,
      staleTime: 30 * 1000,
    });
  };

  // Get a single theme by ID
  const useGetById = (id: string) => {
    return useQuery({
      queryKey: themeKey(id),
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/${id}`);
        return data.data; // Return the theme
      },
      enabled: !!id,
      staleTime: 30 * 1000, // 30 seconds
    });
  };

  // Create a new theme
  const useCreate = () => {
    return useMutation({
      mutationFn: async (createDto: CreateWebSiteThemeDto) => {
        const { data } = await apiClient.post(endpoint, createDto);
        return data.data; // Return the created theme
      },
      onSuccess: (data: WebSiteTheme) => {
        // Update general themes cache
        queryClient.invalidateQueries({ queryKey: [...themesKey, 'all'] });

        // Update website-specific cache
        if (data.websiteId) {
          queryClient.invalidateQueries({
            queryKey: websiteThemesKey(data.websiteId.toString()),
          });

          // Update active theme cache if this theme is active
          if (data.isActive) {
            queryClient.setQueryData(activeThemeKey(data.websiteId.toString()), {
              success: true,
              message: 'Active theme set',
              data,
            });
          }
        }

        // Update specific theme cache
        if (data._id) {
          queryClient.setQueryData(themeKey(data._id.toString()), {
            success: true,
            message: 'Theme retrieved',
            data,
          });
        }
      },
      onError: (error: any) => {
        console.error('Error creating theme:', error.message);
      },
    });
  };

  // Update a theme
  const useUpdate = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: UpdateWebSiteThemeDto }) => {
        const { data: responseData } = await apiClient.patch(`${endpoint}/${id}`, data);
        return responseData.data; // Return the updated theme
      },
      onSuccess: (data: WebSiteTheme, { id }) => {
        // Update specific theme cache
        queryClient.setQueryData(themeKey(id), { success: true, message: 'Theme updated', data });

        // Update general themes cache
        queryClient.invalidateQueries({ queryKey: [...themesKey, 'all'] });

        // Update website-specific cache
        if (data.websiteId) {
          queryClient.invalidateQueries({
            queryKey: websiteThemesKey(data.websiteId.toString()),
          });

          // Update active theme cache if this theme is active
          if (data.isActive) {
            queryClient.setQueryData(activeThemeKey(data.websiteId.toString()), {
              success: true,
              message: 'Active theme set',
              data,
            });
          }
        }

        // If the websiteId was changed, invalidate the old website's caches
        const previousTheme = queryClient.getQueryData<{ data: WebSiteTheme }>(themeKey(id));
        if (
          previousTheme?.data?.websiteId &&
          previousTheme.data.websiteId.toString() !== data.websiteId.toString()
        ) {
          queryClient.invalidateQueries({
            queryKey: websiteThemesKey(previousTheme.data.websiteId.toString()),
          });
          queryClient.invalidateQueries({
            queryKey: activeThemeKey(previousTheme.data.websiteId.toString()),
          });
        }
      },
    });
  };

  // Update theme colors only
  const useUpdateColors = () => {
    return useMutation({
      mutationFn: async ({ id, colors }: { id: string; colors: Partial<WebSiteTheme['colors']> }) => {
        const { data: responseData } = await apiClient.patch(`${endpoint}/colors/${id}`, { colors });
        return responseData.data; // Return the updated theme
      },
      onSuccess: (data: WebSiteTheme, { id }) => {
        // Update specific theme cache
        queryClient.setQueryData(themeKey(id), { success: true, message: 'Theme updated', data });

        // Update website-specific cache
        if (data.websiteId) {
          queryClient.invalidateQueries({
            queryKey: websiteThemesKey(data.websiteId.toString()),
          });

          // Update active theme cache if this theme is active
          if (data.isActive) {
            queryClient.setQueryData(activeThemeKey(data.websiteId.toString()), {
              success: true,
              message: 'Active theme set',
              data,
            });
          }
        }
      },
    });
  };

  // Update theme fonts only
  const useUpdateFonts = () => {
    return useMutation({
      mutationFn: async ({ id, fonts }: { id: string; fonts: Partial<WebSiteTheme['fonts']> }) => {
        const { data: responseData } = await apiClient.patch(`${endpoint}/fonts/${id}`, { fonts });
        return responseData.data; // Return the updated theme
      },
      onSuccess: (data: WebSiteTheme, { id }) => {
        // Update specific theme cache
        queryClient.setQueryData(themeKey(id), { success: true, message: 'Theme updated', data });

        // Update website-specific cache
        if (data.websiteId) {
          queryClient.invalidateQueries({
            queryKey: websiteThemesKey(data.websiteId.toString()),
          });

          // Update active theme cache if this theme is active
          if (data.isActive) {
            queryClient.setQueryData(activeThemeKey(data.websiteId.toString()), {
              success: true,
              message: 'Active theme set',
              data,
            });
          }
        }
      },
    });
  };

  // Set active theme
  const useSetActiveTheme = () => {
    return useMutation({
      mutationFn: async ({ websiteId, themeId }: { websiteId: string; themeId: string }) => {
        const { data: responseData } = await apiClient.post(`${endpoint}/set-active/${websiteId}/${themeId}`);
        return responseData.data; // Return the updated theme
      },
      onSuccess: (data: WebSiteTheme, { websiteId, themeId }) => {
        // Update specific theme cache
        queryClient.setQueryData(themeKey(themeId), { success: true, message: 'Theme updated', data });

        // Update active theme cache
        queryClient.setQueryData(activeThemeKey(websiteId), {
          success: true,
          message: 'Active theme set',
          data,
        });

        // Invalidate all themes for this website to update isActive status
        queryClient.invalidateQueries({
          queryKey: websiteThemesKey(websiteId),
        });

        // Update general themes cache
        queryClient.invalidateQueries({ queryKey: [...themesKey, 'all'] });
      },
    });
  };

  // Clone theme
  const useCloneTheme = () => {
    return useMutation({
      mutationFn: async ({ id, themeName }: { id: string; themeName: string }) => {
        const { data: responseData } = await apiClient.post(`${endpoint}/clone/${id}`, { themeName });
        return responseData.data; // Return the cloned theme
      },
      onSuccess: (data: WebSiteTheme) => {
        // Update general themes cache
        queryClient.invalidateQueries({ queryKey: [...themesKey, 'all'] });

        // Update website-specific cache
        if (data.websiteId) {
          queryClient.invalidateQueries({
            queryKey: websiteThemesKey(data.websiteId.toString()),
          });
        }

        // Update specific theme cache
        if (data._id) {
          queryClient.setQueryData(themeKey(data._id.toString()), {
            success: true,
            message: 'Theme created',
            data,
          });
        }
      },
    });
  };

  // Delete a theme
  const useDelete = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        // Get theme data before deleting to know which website cache to invalidate
        const { data } = await apiClient.get(`${endpoint}/${id}`);
        const websiteId = data?.data?.websiteId?.toString();
        const isActive = data?.data?.isActive;

        // Delete the theme
        await apiClient.delete(`${endpoint}/${id}`);

        return { websiteId, isActive };
      },
      onSuccess: ({ websiteId, isActive }, id) => {
        // Remove the specific theme from cache
        queryClient.removeQueries({ queryKey: themeKey(id) });

        // Update general themes cache
        queryClient.invalidateQueries({ queryKey: [...themesKey, 'all'] });

        // Update website-specific cache
        if (websiteId) {
          queryClient.invalidateQueries({
            queryKey: websiteThemesKey(websiteId),
          });

          // If the deleted theme was active, invalidate active theme cache
          if (isActive) {
            queryClient.invalidateQueries({
              queryKey: activeThemeKey(websiteId),
            });
          }
        }
      },
    });
  };

  // Batch operations for themes
  const useBatchUpdateStatuses = () => {
    return useMutation({
      mutationFn: async (updates: { id: string; isActive: boolean }[]) => {
        const { data: responseData } = await apiClient.post(`${endpoint}/batch-update`, { updates });
        return responseData.data; // Return the updated themes
      },
      onSuccess: () => {
        // Invalidate all theme queries
        queryClient.invalidateQueries({ queryKey: themesKey });
      },
    });
  };

  // Bulk delete themes
  const useBulkDelete = () => {
    return useMutation({
      mutationFn: async (ids: string[]) => {
        const { data: responseData } = await apiClient.post(`${endpoint}/bulk-delete`, { ids });
        return responseData.data; // Return response data
      },
      onSuccess: () => {
        // Invalidate all theme queries
        queryClient.invalidateQueries({ queryKey: themesKey });
      },
    });
  };

  return {
    useGetAll,
    useGetByWebsite,
    useGetActiveTheme,
    useGetById,
    useCreate,
    useUpdate,
    useUpdateColors,
    useUpdateFonts,
    useSetActiveTheme,
    useCloneTheme,
    useDelete,
    useBatchUpdateStatuses,
    useBulkDelete,
  };
}