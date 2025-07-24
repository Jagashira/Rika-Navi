// src/background.ts
import type { Kadai, RuntimeMessage } from "./types/types";

const FETCHER_DOCUMENT_PATH = "fetcher.html";
let isFetching = false; // 複数回同時に実行されるのを防ぐフラグ

// データ処理関数
const handleKadaiDataReceived = (data: Kadai[]) => {
  chrome.storage.local.set(
    { kadaiCache: data, lastFetchTime: new Date().toISOString() },
    () => {
      chrome.runtime.sendMessage({ type: "KADAI_DATA_UPDATED", data });
    }
  );
};

const handleGetDataRequest = () => {
  chrome.storage.local.get(["kadaiCache"], (result) => {
    const data = result.kadaiCache || [];
    const time = result.lastFetchTime || null;
    chrome.runtime.sendMessage({ type: "KADAI_DATA_UPDATED", data, time });
  });
};

// Offscreen Documentを使って課題データをバックグラウンドで取得する
async function fetchKadaiDataInBackground() {
  if (isFetching) return;
  isFetching = true;

  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(FETCHER_DOCUMENT_PATH)],
  });
  if (existingContexts.length > 0) {
    isFetching = false;
    return;
  }
  await chrome.offscreen.createDocument({
    url: FETCHER_DOCUMENT_PATH,
    reasons: [chrome.offscreen.Reason.DOM_PARSER],
    justification: "Fetching assignment data",
  });
}

chrome.runtime.onMessage.addListener((message: any) => {
  switch (message.type) {
    case "KADAI_FETCH_RESULT":
      console.log("Background: Received fetch result.");
      handleKadaiDataReceived(message.data);
      chrome.offscreen.closeDocument();
      isFetching = false;
      break;

    // When the fetcher is ready, tell it to start
    case "FETCHER_READY":
      console.log("Background: Fetcher is ready. Sending command.");
      chrome.runtime.sendMessage({ type: "FETCH_NOW" });
      break;

    case "GET_KADAI_DATA":
      handleGetDataRequest();
      break;
    case "MANUAL_FETCH_REQUEST":
      console.log("Background: 手動更新リクエストを受信しました。");
      fetchKadaiDataInBackground();
      break;
  }
});

// ユーザーがLETUSドメイン内のページを読み込み完了したら、データを取得する
chrome.webNavigation.onCompleted.addListener(
  (details) => {
    if (
      details.url.includes("letus.ed.tus.ac.jp") &&
      !details.url.includes("login") &&
      details.frameId === 0
    ) {
      fetchKadaiDataInBackground();
    }
  },
  { url: [{ hostContains: "letus.ed.tus.ac.jp" }] }
);
