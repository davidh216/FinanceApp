// src/utils/files.ts
// Files are read and written in the browser; nothing is uploaded.

export const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

// Saves `contents` to the user's downloads as `fileName`.
export const downloadFile = (
  fileName: string,
  contents: string,
  type: string
) => {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking straight after the click can cancel the download in some
  // browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
