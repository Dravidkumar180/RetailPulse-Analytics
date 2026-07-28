const ascii = (value: unknown) =>
  String(value ?? "")
    .replaceAll("₹", "INR ")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "");

const escapePdf = (value: string) =>
  ascii(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");

const byteLength = (value: string) => new TextEncoder().encode(value).length;

/**
 * Creates a dependency-free, standards-compliant text PDF.
 * Content is paginated so long analytics reports remain readable.
 */
export const createPdfReport = (title: string, lines: string[]) => {
  const pageLines: string[][] = [];
  const cleanLines = lines.flatMap((line) => {
    const text = ascii(line);
    if (text.length <= 92) return [text];
    const chunks: string[] = [];
    for (let index = 0; index < text.length; index += 92) {
      chunks.push(text.slice(index, index + 92));
    }
    return chunks;
  });

  for (let index = 0; index < cleanLines.length; index += 46) {
    pageLines.push(cleanLines.slice(index, index + 46));
  }
  if (!pageLines.length) pageLines.push(["No analytics data available."]);

  const pageCount = pageLines.length;
  const fontObject = 3 + pageCount * 2;
  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Count ${pageCount} /Kids [${pageLines.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] >>`;

  pageLines.forEach((page, index) => {
    const pageObject = 3 + index * 2;
    const contentObject = pageObject + 1;
    const heading = index === 0 ? title : `${title} - continued`;
    const textCommands = [
      "BT",
      "/F1 16 Tf",
      "48 800 Td",
      `(${escapePdf(heading)}) Tj`,
      "/F1 9 Tf",
      "0 -26 Td",
      ...page.flatMap((line) => [`(${escapePdf(line)}) Tj`, "0 -15 Td"]),
      "ET",
    ].join("\n");
    objects[pageObject] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject] = `<< /Length ${byteLength(textCommands)} >>\nstream\n${textCommands}\nendstream`;
  });
  objects[fontObject] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 1; index <= fontObject; index += 1) {
    offsets[index] = byteLength(pdf);
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${fontObject + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= fontObject; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${fontObject + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
};
