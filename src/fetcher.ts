// src/fetcher.ts
import type { Kadai } from "./types/types";

const KADAI_PAGE_URL = "https://letus.ed.tus.ac.jp/my/";

async function scrapeAndSendData() {
  console.log("Fetcher: 課題ページの取得と解析を開始します。");
  try {
    const response = await fetch(KADAI_PAGE_URL);

    if (response.url.includes("idp.admin.tus.ac.jp")) {
      // ログインページへのリダイレクトを検知
      console.log("Fetcher: ログインしていません。処理を中断します。");
      chrome.runtime.sendMessage({ type: "KADAI_FETCH_RESULT", data: [] });
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const htmlText = await response.text();
    const doc = new DOMParser().parseFromString(htmlText, "text/html");
    const eventElements: NodeListOf<HTMLElement> = doc.querySelectorAll(
      "section#inst323771 div.event"
    );
    const kadaiList: Kadai[] = [];

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

    console.log(
      `Fetcher: ${kadaiList.length}件の課題を見つけました。Backgroundに送信します。`
    );
    chrome.runtime.sendMessage({ type: "KADAI_FETCH_RESULT", data: kadaiList });
  } catch (error) {
    // CORSエラーを含む、すべてのfetch関連エラーをここで捕捉する
    if (error instanceof TypeError) {
      console.log(
        "Fetcher: ログインしていないため、CORSポリシーによりアクセスがブロックされました。これは正常な動作です。"
      );
    } else {
      console.error("Fetcher: データ取得中に予期せぬエラーが発生:", error);
    }
    // 失敗した場合も、空のデータを送って処理を完了させる
    chrome.runtime.sendMessage({ type: "KADAI_FETCH_RESULT", data: [] });
  }
}

scrapeAndSendData();
