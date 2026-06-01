export async function exportElementAsImage({
  elementId,
  fileName = "export.png",
  includeSelectors = [],
  excludeSelectors = []
}) {
  const source = document.getElementById(elementId);
  if (!source) {
    console.error("Export element not found:", elementId);
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.style.background = "white";
  wrapper.style.padding = "24px";
  wrapper.style.position = "fixed";
  wrapper.style.left = "-99999px";
  wrapper.style.top = "0";
  wrapper.style.width = source.offsetWidth + "px";

  includeSelectors.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) wrapper.appendChild(el.cloneNode(true));
  });

  const clone = source.cloneNode(true);
  wrapper.appendChild(clone);

  document.body.appendChild(wrapper);

  excludeSelectors.forEach(selector => {
    wrapper.querySelectorAll(selector).forEach(el => el.remove());
  });

  const canvas = await html2canvas(wrapper, {
    backgroundColor: "#ffffff",
    scale: 2
  });

  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();

  wrapper.remove();
}

export async function exportElementAsPdf({
  elementId,
  fileName = "export.pdf",
  includeSelectors = [],
  excludeSelectors = []
}) {
  const source = document.getElementById(elementId);
  if (!source) {
    console.error("Export element not found:", elementId);
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.style.background = "white";
  wrapper.style.padding = "24px";
  wrapper.style.position = "fixed";
  wrapper.style.left = "-99999px";
  wrapper.style.top = "0";
  wrapper.style.width = source.offsetWidth + "px";

  includeSelectors.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) wrapper.appendChild(el.cloneNode(true));
  });

  const clone = source.cloneNode(true);
  wrapper.appendChild(clone);

  document.body.appendChild(wrapper);

  excludeSelectors.forEach(selector => {
    wrapper.querySelectorAll(selector).forEach(el => el.remove());
  });

  const canvas = await html2canvas(wrapper, {
    backgroundColor: "#ffffff",
    scale: 2
  });

  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
  pdf.save(fileName);

  wrapper.remove();
}

export function handleExport({
  elementId,
  imageFileName = "export.png",
  pdfFileName = "export.pdf",
  includeSelectors = [],
  excludeSelectors = [],
  imageBtnId = "exportImageBtn",
  pdfBtnId = "exportPdfBtn"
}) {
  const imageBtn = document.getElementById(imageBtnId);
  const pdfBtn = document.getElementById(pdfBtnId);

  if (!imageBtn || !pdfBtn) return;

  imageBtn.classList.remove("hidden");
  pdfBtn.classList.remove("hidden");

  imageBtn.onclick = () => {
    exportElementAsImage({
      elementId,
      fileName: imageFileName,
      includeSelectors,
      excludeSelectors
    });
  };

  pdfBtn.onclick = () => {
    exportElementAsPdf({
      elementId,
      fileName: pdfFileName,
      includeSelectors,
      excludeSelectors
    });
  };
}

export function clearExportButtons({
  imageBtnId = "exportImageBtn",
  pdfBtnId = "exportPdfBtn"
} = {}) {
  const imageBtn = document.getElementById(imageBtnId);
  const pdfBtn = document.getElementById(pdfBtnId);

  if (!imageBtn || !pdfBtn) return;

  imageBtn.classList.add("hidden");
  pdfBtn.classList.add("hidden");

  imageBtn.onclick = null;
  pdfBtn.onclick = null;
}