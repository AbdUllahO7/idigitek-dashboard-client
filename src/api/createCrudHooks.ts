import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions 
} from '@tanstack/react-query';
import apiClient from '../lib/api-client';

// Generic type for ID
type Id = string;

// Generic CRUD hook creator
export function createCrudHooks<T extends { _id?: Id }, CreateDto = Omit<T, '_id'>, UpdateDto = Partial<T>>(
  resourceName: string
) {
  // Build the base endpoint
  const endpoint = `/${resourceName}`;
  
  // Query key for collection
  const collectionKey = [resourceName];
  
  // Query key builder for a single item
  const itemKey = (id: Id) => [...collectionKey, id];
  
  // Get all items
  const useGetAll = (options?: UseQueryOptions<T[]>) => {
    return useQuery<T[]>({
      queryKey: collectionKey,
      queryFn: async () => {
        const { data } = await apiClient.get(endpoint);
        return data;
      },
      ...options,
    });
  };
  
  // Get a single item by ID
  const useGetById = (id: Id, options?: UseQueryOptions<T>) => {
    return useQuery<T>({
      queryKey: itemKey(id),
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/${id}`);
        return data;
      },
      enabled: !!id, // Only run if ID is provided
      ...options,
    });
  };
  
  // Create a new item
  const useCreate = (options?: UseMutationOptions<T, Error, CreateDto>) => {
    const queryClient = useQueryClient();
    
    return useMutation<T, Error, CreateDto>({
      mutationFn: async (createDto) => {
        const { data } = await apiClient.post(endpoint, createDto);
        return data;
      },
      onSuccess: (data) => {
        // Invalidate the collection query to refetch the list
        queryClient.invalidateQueries({ queryKey: collectionKey });
        // If we have an ID, also update the individual item cache
        if (data._id) {
          queryClient.setQueryData(itemKey(data._id), data);
        }
      },
      ...options,
    });
  };
  
  // Update an item
  const useUpdate = (options?: UseMutationOptions<T, Error, { id: Id; data: UpdateDto }>) => {
    const queryClient = useQueryClient();
    
    return useMutation<T, Error, { id: Id; data: UpdateDto }>({
      mutationFn: async ({ id, data }) => {
        const { data: responseData } = await apiClient.put(`${endpoint}/${id}`, data);
        return responseData;
      },
      onSuccess: (data, { id }) => {
        // Update the item in cache
        queryClient.setQueryData(itemKey(id), data);
        // Invalidate the collection to refetch the list
        queryClient.invalidateQueries({ queryKey: collectionKey });
      },
      ...options,
    });
  };
  
  // Toggle active status
  const useToggleActive = (options?: UseMutationOptions<T, Error, { id: Id; isActive: boolean }>) => {
    const queryClient = useQueryClient();
    
    return useMutation<T, Error, { id: Id; isActive: boolean }>({
      mutationFn: async ({ id, isActive }) => {
        const { data: responseData } = await apiClient.patch(`${endpoint}/${id}/status`, { isActive });
        return responseData;
      },
      onSuccess: (data, { id }) => {
        // Update the item in cache
        queryClient.setQueryData(itemKey(id), data);
        // Invalidate the collection to refetch the list
        queryClient.invalidateQueries({ queryKey: collectionKey });
      },
      ...options,
    });
  };
  
  // Delete an item
  const useDelete = (options?: UseMutationOptions<void, Error, Id>) => {
    const queryClient = useQueryClient();
    
    return useMutation<void, Error, Id>({
      mutationFn: async (id) => {
        await apiClient.delete(`${endpoint}/${id}`);
      },
      onSuccess: (_, id) => {
        // Remove the item from cache
        queryClient.removeQueries({ queryKey: itemKey(id) });
        // Invalidate the collection to refetch the list
        queryClient.invalidateQueries({ queryKey: collectionKey });
      },
      ...options,
    });
  };
  
  // Return all hooks
  return {
    useGetAll,
    useGetById,
    useCreate,
    useUpdate,
    useToggleActive,
    useDelete,
  };
}