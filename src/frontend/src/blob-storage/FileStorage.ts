import { HttpAgent } from "@icp-sdk/core/agent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import {
  type FileReference,
  type StorageActorInterface,
  StorageClient,
} from "./StorageClient";

const getHttpAgent = async () => {
  const config = await loadConfig();

  const agent = new HttpAgent({
    host: config.backend_host,
  });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch((err) => {
      console.warn(
        "Unable to fetch root key. Check to ensure that your local replica is running",
      );
      console.error(err);
    });
  }
  return agent;
};

const getStorageClient = async (actor: StorageActorInterface) => {
  const envConfig = await loadConfig();
  return new StorageClient(
    actor,
    envConfig.bucket_name,
    envConfig.storage_gateway_url,
    envConfig.backend_canister_id,
    envConfig.project_id,
    await getHttpAgent(),
  );
};

// Hook to fetch the list of files
export const useFileList = () => {
  const { actor } = useActor();
  const storageActor = actor as unknown as StorageActorInterface | null;

  return useQuery<FileReference[]>({
    queryKey: ["fileList"],
    queryFn: async () => {
      if (!storageActor) throw new Error("Backend is not available");
      return storageActor.listFileReferences();
    },
    enabled: !!storageActor,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Unified hook for getting file URLs
export const useFileUrl = (path: string) => {
  const { actor } = useActor();

  return useQuery<string>({
    queryKey: ["fileUrl", path],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not available");
      const storageClient = await getStorageClient(
        actor as unknown as StorageActorInterface,
      );
      return storageClient.getDirectURL(path);
    },
    enabled: !!path && !!actor,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useFileUpload = () => {
  const { actor } = useActor();
  const [isUploading, setIsUploading] = useState(false);
  const { invalidateFileList } = useInvalidateQueries();

  const uploadFile = async (
    path: string,
    data: File,
    onProgress?: (percentage: number) => void,
  ): Promise<{
    path: string;
    hash: string;
    url: string;
  }> => {
    if (!actor) {
      throw new Error("Backend is not available");
    }

    const storageClient = await getStorageClient(
      actor as unknown as StorageActorInterface,
    );
    setIsUploading(true);

    try {
      const res = await storageClient.putFile(path, data, onProgress);
      await invalidateFileList();
      return res;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
};

export const useFileDelete = () => {
  const { actor } = useActor();
  const [isDeleting, setIsDeleting] = useState(false);
  const { invalidateFileList, invalidateFileUrl } = useInvalidateQueries();
  const storageActor = actor as unknown as StorageActorInterface | null;

  const deleteFile = async (path: string): Promise<void> => {
    if (!storageActor) {
      throw new Error("Backend is not available");
    }

    setIsDeleting(true);

    try {
      await storageActor.dropFileReference(path);
      await invalidateFileList();
      invalidateFileUrl(path);
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteFile, isDeleting };
};

// Utility to invalidate queries
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateFileList: () =>
      queryClient.invalidateQueries({ queryKey: ["fileList"] }),
    invalidateFileUrl: (path: string) =>
      queryClient.invalidateQueries({ queryKey: ["fileUrl", path] }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ["fileList"] });
      queryClient.invalidateQueries({ queryKey: ["fileUrl"] });
    },
  };
};
