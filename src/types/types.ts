import type { User as FirebaseUser } from "firebase/auth";

export interface Kadai {
  id?: string;
  title: string;
  deadline: string;
  // courseName: string;
  // courseUrl: string;
}

export type ErrorResponse = {
  message: string | null;
};
export type SignInResponse = {
  user?: FirebaseUser;
  idToken?: string;
  error?: ErrorResponse;
};
export type RuntimeMessage =
  // UIからBackground
  | { type: "SIGN_IN" }
  | { type: "GET_KADAI_DATA" } // chrome.storage.localから課題データを取得
  | { type: "MANUAL_FETCH_REQUEST" } // 手動でLETUSから課題データを取得
  | {
      type: "SAVE_KADAI_DATA"; // UIや他の場所から直接課題データを保存
      data: Kadai[];
      time: string | null;
      error?: ErrorResponse;
    }

  // 2. BackgroundからUI
  | {
      type: "SIGN_IN_RESPONSE"; // SIGN_IN リクエストに対するサインイン結果
      user?: FirebaseUser;
      idToken?: string;
      error?: ErrorResponse;
    }
  | {
      type: "KADAI_DATA_UPDATED"; // 課題データが更新されたことを通知(データもあるよ)
      data: Kadai[];
      time: string | null;
      error?: ErrorResponse;
    }

  // 3. Background <-> Offscreen Document
  | {
      type: "FETCH_NOW";
      target: "fetcher-offscreen";
    }
  | {
      //Offscreen DocumentからBackground
      type: "SAVE_KADAI_DATA_FROM_FETCHER";
      data: Kadai[];
      time: string | null;
      error?: ErrorResponse;
      target?: "background";
    }
  | {
      type: "FETCHER_ERROR";
      error: ErrorResponse;
      target?: "background";
    };
