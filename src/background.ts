import type { Kadai, RuntimeMessage } from "./types/types";

const KADAI_PAGE_URL = "https://letus.ed.tus.ac.jp/my/";

const handleFetchRequest = async () => {
  console.log("--- スクリプト注入テスト開始 ---");
  try {
    const tab = await chrome.tabs.create({
      url: KADAI_PAGE_URL,
      active: false,
    });
    if (tab && tab.id) {
      const contentScripts = chrome.runtime.getManifest().content_scripts;
      if (contentScripts && contentScripts[0]?.js) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: contentScripts[0].js,
        });
        console.log("✅ スクリプト注入完了。応答を待っています...");
      }
      setTimeout(() => {
        if (tab.id) chrome.tabs.remove(tab.id);
      }, 5000);
    } else {
      console.error("❌タブの作成に失敗しました。");
    }
  } catch (e) {
    console.error("❌ テストのセットアップ中に失敗:", e);
  }
};

const handleKadaiFound = (data: Kadai[]) => {
  console.log(`✅ 成功！ ${data.length}件の課題が見つかりました。`);
  chrome.storage.local.set({ kadaiCache: data }, () => {
    chrome.runtime.sendMessage({ type: "KADAI_DATA_UPDATED", data });
  });
};

const handleGetDataRequest = () => {
  chrome.storage.local.get(["kadaiCache"], (result) => {
    const data = result.kadaiCache || [];
    chrome.runtime.sendMessage({ type: "KADAI_DATA_UPDATED", data });
  });
};

chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
  switch (message.type) {
    case "TEST_FETCH":
      handleFetchRequest();
      break;
    case "KADAI_FOUND":
      handleKadaiFound(message.data);
      break;
    case "GET_KADAI_DATA":
      handleGetDataRequest();
      break;
  }
});
