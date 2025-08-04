// src/background.ts
import { auth } from "./_lib/firebase";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import {
  type ErrorResponse,
  type Kadai,
  type RuntimeMessage,
} from "./types/types";

const FETCHER_DOCUMENT_PATH = "fetcher.html";
let isFetching = false;

// Offscreen Documentが存在するかどうかcheck
async function hasOffscreenDocument(path: string): Promise<boolean> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(path)],
  });
  return existingContexts.length > 0;
}

//認証
const signIn = async (sendResponse: any) => {
  console.log("Background: ユーザーのサインインを開始します。");
  try {
    const token = await new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: true }, resolve);
    });
    if (!token) {
      throw new Error("Google Auth Token not found.");
    }
    //@ts-expect-error tokenの型が不明なため
    const credential = GoogleAuthProvider.credential(null, token);
    const userCredential = await signInWithCredential(auth, credential);

    const user = userCredential.user;
    const idToken = await user.getIdToken(true);
    sendResponse({ user: user, token: idToken });
  } catch (error) {
    console.log("Error during sign-in", error);
    sendResponse({ error: error });
  }
};

//課題データの取得 from chrome.storage.local
const handleGetDataRequest = () => {
  chrome.storage.local.get(["kadaiCache", "lastFetchTime"], (result) => {
    const data = result.kadaiCache || [];
    const time = result.lastFetchTime || null;
    console.log("Background: Sending cached data to popup.");
    console.log("Data:", data);
    console.log("Last Fetch Time:", time);
    chrome.runtime.sendMessage({
      type: "KADAI_DATA_UPDATED",
      data,
      time,
      error: null,
    });
  });
};

//課題を保存する(chrome.storage.localに保存)
//KADAI_DATA_UPDATEDでポップアップに通知
const handleKadaiDataReceived = (
  data: Kadai[],
  time: string | null,
  errorResponse?: ErrorResponse
) => {
  console.log("Background: 課題データを保存します。", data.length, "件");
  chrome.storage.local.set({ kadaiCache: data, lastFetchTime: time }, () => {
    if (chrome.runtime.lastError) {
      console.error(
        "Background: Error saving data to storage:",
        chrome.runtime.lastError
      );
      chrome.runtime.sendMessage({
        type: "KADAI_DATA_UPDATED",
        data: [],
        time: null,
        error: errorResponse || {
          error: "Failed to save data to storage.",
        },
      });
    } else {
      console.log(
        "Background: 課題データの保存が完了しました。ポップアップに通知します。"
      );
      chrome.runtime.sendMessage({
        type: "KADAI_DATA_UPDATED",
        data,
        time,
        error: null,
      });
    }
  });
};

//課題データの取得 from LETUS
// async function fetchKadaiDataInBackground() {
//   if (isFetching) return;
//   isFetching = true;

//   const existingContexts = await chrome.runtime.getContexts({
//     contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
//     documentUrls: [chrome.runtime.getURL(FETCHER_DOCUMENT_PATH)],
//   });
//   if (existingContexts.length > 0) {
//     isFetching = false;
//     return;
//   }
//   await chrome.offscreen.createDocument({
//     url: FETCHER_DOCUMENT_PATH,
//     reasons: [chrome.offscreen.Reason.DOM_PARSER],
//     justification: "Fetching assignment data",
//   });
// }
async function fetchKadaiDataInBackground() {
  if (isFetching) {
    console.log("Background: 課題データはすでにフェッチ中です。");
    return;
  }
  isFetching = true;
  console.log("Background: バックグラウンドでの課題データ取得を開始します。");

  try {
    if (!(await hasOffscreenDocument(FETCHER_DOCUMENT_PATH))) {
      console.log("Background: Fetcher Offscreen Documentを作成します。");
      await chrome.offscreen.createDocument({
        url: FETCHER_DOCUMENT_PATH,
        reasons: [
          chrome.offscreen.Reason.DOM_PARSER,
          chrome.offscreen.Reason.IFRAME_SCRIPTING,
        ],
        justification: "Fetching assignment data from LETUS.",
      });
    } else {
      console.log("Background: Fetcher Offscreen Documentはすでに存在します。");
    }

    await new Promise((resolve, reject) => {
      const messageListener = (message: RuntimeMessage) => {
        if (message.type === "SAVE_KADAI_DATA_FROM_FETCHER") {
          console.log("Background: Fetcherから課題データ受信。");
          handleKadaiDataReceived(message.data, message.time, message.error);
          chrome.runtime.onMessage.removeListener(messageListener);
          resolve(true);
        } else if (message.type === "FETCHER_ERROR") {
          console.error("Background: Fetcherからエラーを受信:", message.error);
          handleKadaiDataReceived([], null, message.error);
          chrome.runtime.onMessage.removeListener(messageListener);
          reject(new Error(message.error?.message || "Fetcher error"));
        }
      };
      chrome.runtime.onMessage.addListener(messageListener);

      // chrome.runtime.sendMessage({
      //   type: "FETCH_NOW",
      //   target: "fetcher-offscreen",
      // });
    });
  } catch (error: any) {
    console.error(
      "Background: Error during fetchKadaiDataInBackground:",
      error
    );

    handleKadaiDataReceived([], null, {
      message: error.message || "Unknown error during fetch",
    });
  } finally {
    isFetching = false;
    if (await hasOffscreenDocument(FETCHER_DOCUMENT_PATH)) {
      console.log("Background: Fetcher Offscreen Documentを閉じます。");
      await chrome.offscreen.closeDocument();
    }
  }
}

///////////////////////////////////
//addListenerを設定

chrome.runtime.onMessage.addListener(
  (
    message: RuntimeMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    switch (message.type) {
      case "SIGN_IN":
        console.log(
          "Background(addListener): サインインリクエストを受信しました。"
        );
        signIn(sendResponse);
        return true;

      case "GET_KADAI_DATA_FROM_CHROME_STORAGE":
        console.log(
          "Background(GET_KADAI_DATA_FROM_CHROME_STORAGE): Chrome Storageから取得"
        );
        handleGetDataRequest();
        break;

      case "SAVE_KADAI_DATA_TO_CHROME_STORAGE":
        console.log(
          "Background(addListener): 課題データを保存するリクエストを受信しました。",
          message.data?.length || 0,
          "件"
        );
        handleKadaiDataReceived(message.data!, message.time!, message.error);
        break;

      case "MANUAL_FETCH_REQUEST":
        console.log("Background: 手動更新リクエストを受信しました。");
        fetchKadaiDataInBackground();
        break;
      case "CONSOLE_LOG":
        console.log(
          "Background: コンソールログリクエストを受信:",
          message.message
        );
        break;
    }
  }
);

// Offscreen DocumentのURLを監視して、課題データを取得
chrome.webNavigation.onCompleted.addListener(
  (details) => {
    if (
      details.url.includes("letus.ed.tus.ac.jp") &&
      !details.url.includes("login") &&
      details.frameId === 0
    ) {
      console.log(
        "Background: LETUSページ読み込み完了、課題データの自動フェッチをトリガーします。"
      );
      fetchKadaiDataInBackground();
    }
  },
  { url: [{ hostContains: "letus.ed.tus.ac.jp" }] }
);
