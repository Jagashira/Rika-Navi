export interface Kadai {
  title: string;
  deadline: string;
}

export type RuntimeMessage =
  | { type: "KADAI_FOUND"; data: Kadai[] }
  | { type: "GET_KADAI_DATA" }
  | { type: "KADAI_DATA_UPDATED"; data: Kadai[]; time?: string | null }
  | { type: "TEST_FETCH" }; // Test button message
