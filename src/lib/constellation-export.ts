import type { Option, Participant, Question, ResponseRow } from "@/lib/game";

// Fond sombre de l'application (#252525, cf. --background dans styles.css).
const FOND_SOMBRE = "#252525";

/** Déclenche le téléchargement d'un blob côté navigateur, sans serveur. */
function telecharger(blob: Blob, nomFichier: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Sérialise un <svg> du DOM puis le rasterise dans un canvas, sur fond opaque.
 * Méthode légère : XMLSerializer + data-URI + <img> + drawImage, aucune dépendance.
 */
async function svgVersCanvas(
  svg: SVGSVGElement,
  fond: string,
  echelle = 2,
): Promise<HTMLCanvasElement> {
  const vb = (svg.getAttribute("viewBox") ?? "0 0 800 800").split(/\s+/).map(Number);
  const largeur = vb[2] && vb[2] > 0 ? vb[2] : 800;
  const hauteur = vb[3] && vb[3] > 0 ? vb[3] : 800;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(largeur));
  clone.setAttribute("height", String(hauteur));
  // Police système lisible : les fontes web ne sont pas chargées dans un SVG
  // rasterisé, mais les emojis, eux, s'affichent.
  clone.style.fontFamily = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

  const source = new XMLSerializer().serializeToString(clone);
  const dataUri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Impossible de rasteriser la constellation"));
    img.src = dataUri;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(largeur * echelle);
  canvas.height = Math.round(hauteur * echelle);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponible");
  ctx.fillStyle = fond;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Export 1 : la constellation en PNG, fond sombre conservé. */
export async function exporterConstellationPng(svg: SVGSVGElement) {
  const canvas = await svgVersCanvas(svg, FOND_SOMBRE, 2);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Génération du PNG impossible");
  telecharger(blob, "constellation-radioking.png");
}

export type DonneesResume = {
  questions: Question[];
  options: Option[];
  participants: Participant[];
  responses: ResponseRow[];
};

// Les polices standard de jsPDF (Helvetica…) ne contiennent pas les emojis :
// on les retire du texte du PDF pour éviter des caractères parasites. Les
// emojis restent visibles sur la constellation en page 1 (image rasterisée).
function sansEmoji(s: string): string {
  return s
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Export 2 : un PDF (généré côté navigateur avec jsPDF) contenant la
 * constellation en page 1, puis pour chaque question son titre, son prompt et
 * la réponse de chaque participant (nom + libellé de l'option choisie).
 */
export async function exporterResumePdf(svg: SVGSVGElement, donnees: DonneesResume) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageL = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marge = 15;

  // --- Page 1 : la constellation, sur fond sombre (#252525 = rgb 37,37,37) ---
  doc.setFillColor(37, 37, 37);
  doc.rect(0, 0, pageL, pageH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Icebreaker RadioKing — La Constellation", pageL / 2, marge + 4, { align: "center" });

  const canvas = await svgVersCanvas(svg, FOND_SOMBRE, 2);
  const image = canvas.toDataURL("image/png");
  const dispoL = pageL - marge * 2;
  const dispoH = pageH - marge * 2 - 12;
  const ratio = Math.min(dispoL / canvas.width, dispoH / canvas.height);
  const imgL = canvas.width * ratio;
  const imgH = canvas.height * ratio;
  doc.addImage(image, "PNG", (pageL - imgL) / 2, marge + 12, imgL, imgH, undefined, "MEDIUM");

  // --- Pages suivantes : réponses détaillées par question ---
  doc.addPage();
  let y = marge;
  const bas = pageH - marge;
  const sautSiBesoin = (hauteurNecessaire: number) => {
    if (y + hauteurNecessaire > bas) {
      doc.addPage();
      y = marge;
    }
  };

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Résumé des réponses", marge, y);
  y += 10;

  const participants = [...donnees.participants].sort((a, b) =>
    a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
  );

  donnees.questions.forEach((question, index) => {
    sautSiBesoin(24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    const titre = doc.splitTextToSize(
      `${index + 1}. ${sansEmoji(question.title)}`,
      pageL - marge * 2,
    );
    doc.text(titre, marge, y);
    y += titre.length * 6;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    const prompt = doc.splitTextToSize(sansEmoji(question.prompt), pageL - marge * 2);
    doc.text(prompt, marge, y);
    y += prompt.length * 5 + 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);

    const optionsQuestion = donnees.options.filter((o) => o.question_id === question.id);
    if (participants.length === 0) {
      sautSiBesoin(6);
      doc.text("Aucun participant.", marge + 2, y);
      y += 6;
    }
    participants.forEach((participant) => {
      sautSiBesoin(6);
      const reponse = donnees.responses.find(
        (r) => r.participant_id === participant.id && r.question_id === question.id,
      );
      const option = reponse ? optionsQuestion.find((o) => o.id === reponse.option_id) : undefined;
      const choix = option ? sansEmoji(option.label) : "— (pas de réponse)";
      const ligne = doc.splitTextToSize(
        `- ${sansEmoji(participant.name)} : ${choix}`,
        pageL - marge * 2 - 2,
      );
      doc.text(ligne, marge + 2, y);
      y += ligne.length * 5;
    });

    y += 6;
  });

  doc.save("resume-icebreaker-radioking.pdf");
}
