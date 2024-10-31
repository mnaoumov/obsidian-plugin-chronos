import html2canvas from "html2canvas";

export function exportHtmlToImage(container: HTMLElement) {
  if (container) {
    html2canvas(container).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `timeline_${new Date().getTime()}.png`;
      link.click();
    });
  }
}
