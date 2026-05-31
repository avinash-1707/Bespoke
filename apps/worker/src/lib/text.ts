/** Normalize model output before it is stored or shown to users. */
export function cleanGeneratedText(text: string): string {
  return text.trim().replaceAll("—", ", ");
}
