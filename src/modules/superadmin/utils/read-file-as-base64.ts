export function readFileAsBase64(file: File): Promise<{ dataBase64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve({
        dataBase64: result.split(',')[1] ?? '',
        contentType: file.type || 'application/pdf',
      });
    };
    reader.onerror = () => {
      reject(new Error('Could not read the file'));
    };
    reader.readAsDataURL(file);
  });
}
