import { ref } from 'vue';
import type { Ref } from 'vue';
import type { DesignerFile } from '@/types/designerFile';

const STORAGE_KEYS = {
  FILES: 'pdfDesignerFiles',
  LAST_FILE: 'pdfDesignerLastFile'
} as const;

function parseFileDates(file: DesignerFile): DesignerFile {
  return {
    ...file,
    lastModified: file.lastModified ? new Date(file.lastModified) : new Date(),
    createdAt: file.createdAt ? new Date(file.createdAt) : new Date()
  };
}

function normalizeContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  return JSON.stringify(content);
}

export function useDesignerFiles(options?: {
  currentFileName?: Ref<string>;
  currentFileId?: Ref<string | null>;
}) {
  const currentFileName = options?.currentFileName ?? ref('未命名报表');
  const currentFileId = options?.currentFileId ?? ref<string | null>(null);
  const files = ref<DesignerFile[]>([]);

  function loadFilesFromStorage() {
    try {
      const storedFiles = localStorage.getItem(STORAGE_KEYS.FILES);
      if (!storedFiles) {
        files.value = [];
        return;
      }
      const parsedFiles = JSON.parse(storedFiles) as DesignerFile[];
      files.value = parsedFiles.map(parseFileDates);
    } catch {
      files.value = [];
    }
  }

  function saveFilesToStorage(nextFiles?: DesignerFile[]) {
    try {
      if (nextFiles) {
        files.value = nextFiles;
      }
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files.value));
      return true;
    } catch {
      return false;
    }
  }

  function upsertFile(file: DesignerFile) {
    const nextFiles = [...files.value];
    const index = nextFiles.findIndex(f => f.id === file.id);
    const normalized = parseFileDates(file);
    if (index !== -1) {
      nextFiles[index] = { ...nextFiles[index], ...normalized };
    } else {
      nextFiles.push(normalized);
    }
    return saveFilesToStorage(nextFiles);
  }

  function renameFile(id: string, newName: string) {
    const nextFiles = files.value.map(file => {
      if (file.id !== id) return file;
      return { ...file, name: newName, lastModified: new Date() };
    });
    const ok = saveFilesToStorage(nextFiles);
    if (currentFileId.value === id) {
      currentFileName.value = newName;
    }
    return ok;
  }

  function deleteFile(id: string) {
    const nextFiles = files.value.filter(file => file.id !== id);
    const ok = saveFilesToStorage(nextFiles);
    if (currentFileId.value === id) {
      currentFileId.value = null;
      currentFileName.value = '未命名报表';
    }
    return ok;
  }

  function saveCurrentFileContent(content: unknown) {
    const timestamp = Date.now();
    const id = currentFileId.value || `file_${timestamp}`;
    currentFileId.value = id;

    const existing = files.value.find(f => f.id === id);
    const nowIso = new Date().toISOString();

    const ok = upsertFile({
      id,
      name: currentFileName.value,
      content: normalizeContent(content),
      lastModified: nowIso,
      createdAt: existing?.createdAt ? existing.createdAt : nowIso
    });

    setLastFile({ id, name: currentFileName.value });
    return ok;
  }

  function setLastFile(last: { id: string; name: string }) {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_FILE, JSON.stringify(last));
    } catch {
      return;
    }
  }

  function loadLastFile(): { id: string; name: string } | null {
    try {
      const lastFileData = localStorage.getItem(STORAGE_KEYS.LAST_FILE);
      if (!lastFileData) return null;
      const parsed = JSON.parse(lastFileData) as { id: string; name: string };
      if (!parsed?.id) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function findFileById(id: string) {
    return files.value.find(file => file.id === id);
  }

  function clearStoredFiles() {
    try {
      localStorage.removeItem(STORAGE_KEYS.FILES);
      localStorage.removeItem(STORAGE_KEYS.LAST_FILE);
      files.value = [];
      currentFileId.value = null;
      currentFileName.value = '未命名报表';
    } catch {
      return;
    }
  }

  return {
    currentFileId,
    currentFileName,
    files,
    loadFilesFromStorage,
    saveFilesToStorage,
    upsertFile,
    renameFile,
    deleteFile,
    saveCurrentFileContent,
    loadLastFile,
    findFileById,
    clearStoredFiles,
    setLastFile
  };
}
