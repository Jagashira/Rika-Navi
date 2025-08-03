// 課題ページを取得して解析する
import { scrapeKadaiFromDocument } from "./_lib/scrapeKadai";
import type { Kadai } from "./types/types";

const KADAI_PAGE_URL = "https://letus.ed.tus.ac.jp/my/";

//LETUSから課題データを取得する関数 (offscreen document)
async function fetcher() {
  console.log("Fetcher: 課題ページの取得と解析を開始します。");
  try {
    const response = await fetch(KADAI_PAGE_URL);

    if (response.url.includes("idp.admin.tus.ac.jp")) {
      console.log("Fetcher: ログインしていません。処理を中断します。");
      chrome.runtime
        .sendMessage({
          type: "SAVE_KADAI_DATA_FROM_FETCHER",
          data: [],
          time: null,
          error: { message: "Not logged in to LETUS." },
        })
        .catch((e) =>
          console.error("Fetcher: Error sending not logged in message:", e)
        );
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const htmlText = await response.text();
    const doc = new DOMParser().parseFromString(htmlText, "text/html");
    const kadaiList: Kadai[] = scrapeKadaiFromDocument(doc);

    console.log(
      `Fetcher: ${kadaiList.length}件の課題を見つけました。Backgroundに送信します。`
    );

    chrome.runtime
      .sendMessage({
        type: "SAVE_KADAI_DATA_FROM_FETCHER",
        data: kadaiList,
        time: new Date().toISOString(),
        error: null,
      })
      .catch((e) =>
        console.error("Fetcher: Error sending successful data message:", e)
      );
  } catch (error: any) {
    console.error("Fetcher: データ取得中にエラーが発生:", error);

    const errorMessage =
      error instanceof TypeError
        ? "Network error or CORS policy blocked. Check login status."
        : error.message || "Unknown fetch error.";

    chrome.runtime
      .sendMessage({
        type: "SAVE_KADAI_DATA_FROM_FETCHER",
        data: [],
        time: null,
        error: { message: errorMessage },
      })
      .catch((e) =>
        console.error("Fetcher: Error sending failed data message:", e)
      );
  }
}

fetcher();
