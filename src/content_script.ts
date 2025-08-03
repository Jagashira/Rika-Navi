// //LETUSから課題を取得する
// import type { Kadai } from "./types/types";

// function parseLetusDate(dateString: string): string {
//   const now = new Date();
//   let year = now.getFullYear();
//   let month = now.getMonth();
//   let day = now.getDate();

//   // 時刻部分を抽出 (例: "18:00")
//   const timeMatch = dateString.match(/(\d{1,2}):(\d{2})/);
//   if (!timeMatch) {
//     return dateString; // 時刻がなければ解析不能
//   }
//   const [, hour, minute] = timeMatch;

//   if (dateString.includes("本日")) {
//     // "本日"の場合、日付は今日
//   } else if (dateString.includes("明日")) {
//     // "明日"の場合、日付は明日
//     const tomorrow = new Date();
//     tomorrow.setDate(now.getDate() + 1);
//     year = tomorrow.getFullYear();
//     month = tomorrow.getMonth();
//     day = tomorrow.getDate();
//   } else {
//     // "2025年 08月 05日" のような形式をパース
//     const dateMatch = dateString.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
//     if (dateMatch) {
//       const [, parsedYear, parsedMonth, parsedDay] = dateMatch;
//       year = parseInt(parsedYear, 10);
//       month = parseInt(parsedMonth, 10) - 1;
//       day = parseInt(parsedDay, 10);
//     } else {
//       return dateString; // "本日" "明日" 以外の形式で日付がなければ解析不能
//     }
//   }

//   // 日本時間としてDateオブジェクトを作成
//   const jstDate = new Date(
//     year,
//     month,
//     day,
//     parseInt(hour, 10),
//     parseInt(minute, 10)
//   );

//   // 有効な日付かチェック
//   if (isNaN(jstDate.getTime())) {
//     return dateString;
//   }

//   return jstDate.toISOString();
// }

// const eventElements: NodeListOf<HTMLElement> = document.querySelectorAll(
//   "section#inst323771 div.event"
// );

// const kadaiList: Omit<Kadai, "id">[] = [];

// eventElements.forEach((eventEl) => {
//   const titleElement: HTMLElement | null =
//     eventEl.querySelector("h6 a.text-truncate");
//   const deadlineElement: HTMLElement | null = eventEl.querySelector("div.date");
//   const courseElement: HTMLAnchorElement | null = eventEl.querySelector(
//     "div.d-flex > a:not([data-type='event'])"
//   );

//   if (titleElement && deadlineElement && courseElement) {
//     kadaiList.push({
//       title: titleElement.innerText.trim(),
//       deadline: deadlineElement.innerText.trim(),
//     });
//   }
// });

// if (kadaiList.length > 0) {
//   chrome.runtime.sendMessage({
//     type: "KADAI_FOUND",
//     data: kadaiList,
//   });
// }
