import type { Kadai } from "../types/types";

export function scrapeKadaiFromDocument(doc: Document): Kadai[] {
  const kadaiList: Kadai[] = [];
  const eventElements: NodeListOf<HTMLElement> = doc.querySelectorAll(
    "section#inst323771 div.event"
  );

  eventElements.forEach((eventEl) => {
    const titleElement: HTMLElement | null =
      eventEl.querySelector("h6 a.text-truncate");
    const deadlineElement: HTMLElement | null =
      eventEl.querySelector("div.date");
    if (titleElement && deadlineElement) {
      kadaiList.push({
        title: titleElement.innerText.trim(),
        deadline: deadlineElement.innerText.trim(),
      });
    }
  });
  return kadaiList;
}
