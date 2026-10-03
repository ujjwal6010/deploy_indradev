import { toPng } from 'html-to-image';

// export any DOM element as PNG, trigger download
export async function exportElementAsPng(el: HTMLElement, filename: string) {
  try {
    const dataUrl = await toPng(el, {
      backgroundColor: '#060d1a',
      pixelRatio: 2, // retina quality for PPT
    });
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('export failed:', err);
  }
}

// helper to get the echarts instance and export its canvas
export function exportEchartsAsPng(chartRef: any, filename: string) {
  if (!chartRef?.current) return;
  const instance = chartRef.current.getEchartsInstance();
  if (!instance) return;
  const url = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#060d1a' });
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = url;
  link.click();
}
