/**
 * Triggers a file download in the browser.
 * Replaces the functionality of file-saver's saveAs.
 * @param {Blob} blob - The data to be saved in a Blob.
 * @param {string} filename - The name of the file to be saved.
 */
export const saveFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Captures the content of a chart's canvas element as a PNG Blob.
 * A simplified replacement for html2canvas for this specific use case.
 * @param {HTMLElement} element - The container element holding the chart canvas.
 * @returns {Promise<Blob>} A promise that resolves with the image Blob.
 */
export const captureChartAsBlob = (element) => {
  return new Promise((resolve, reject) => {
    if (!element) {
      return reject(new Error('Target element not provided.'));
    }

    const canvas = element.querySelector('canvas');
    if (!canvas) {
      return reject(new Error('Canvas element not found within the target.'));
    }

    // To add a background color like html2canvas did, we need to draw on a new canvas.
    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height;
    const ctx = newCanvas.getContext('2d');

    // Get background color from CSS variables
    const backgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--w-background-color-dark')
      .trim() || '#1a202c'; // Fallback color

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

    // Draw the original chart canvas on top
    ctx.drawImage(canvas, 0, 0);

    newCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob from canvas.'));
      }
    }, 'image/png');
  });
};

/**
 * Converts an array of objects to a CSV string and triggers download.
 * @param {Array<Object>} data - The array of data to be converted.
 * @param {string} filename - The name of the CSV file.
 */
export const exportToCsv = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn('No data provided for CSV export.');
    return;
  }

  const headers = Object.keys(data[0]);
  let csvContent = headers.join(',') + '\n';

  csvContent += data.map(row =>
    headers.map(header => {
      let cell = row[header];
      if (cell === null || cell === undefined) {
        return '';
      }
      cell = String(cell);
      // Escape quotes and wrap in quotes if it contains a comma, newline, or quote
      if (/[",\n]/.test(cell)) {
        cell = `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveFile(blob, filename);
};
