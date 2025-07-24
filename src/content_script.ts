import type { Kadai } from "./types/types";

const eventElements: NodeListOf<HTMLElement> = document.querySelectorAll(
  "section#inst323771 div.event"
);
const kadaiList: Kadai[] = [];

eventElements.forEach((eventEl) => {
  const titleElement: HTMLElement | null =
    eventEl.querySelector("h6 a.text-truncate");
  const deadlineElement: HTMLElement | null = eventEl.querySelector("div.date");

  if (titleElement && deadlineElement) {
    kadaiList.push({
      title: titleElement.innerText.trim(),
      deadline: deadlineElement.innerText.trim(),
    });
  }
});

if (kadaiList.length > 0) {
  chrome.runtime.sendMessage({ type: "KADAI_FOUND", data: kadaiList });
}
