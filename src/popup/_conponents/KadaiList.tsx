import { formatDeadline } from "../../_lib/formatDate";
import type { Kadai } from "../../types/types";

export const KadaiItem = ({ task }: { task: Kadai }) => {
  const getDeadlineColor = (deadline: string): string => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffHours =
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) return "text-red-600";
    if (diffHours < 72) return "text-orange-500";
    return "text-slate-500";
  };

  const openTaskUrl = () => {
    if (task.courseUrl) {
      chrome.tabs.create({ url: task.courseUrl });
    }
  };

  return (
    <li
      className="text-left bg-white p-3 rounded-lg shadow-sm border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
      onClick={openTaskUrl}
      title="クリックして課題ページを開く"
    >
      <div className="flex justify-between items-start gap-2">
        <strong className="text-sm text-slate-900 break-words flex-grow">
          {task.title}
        </strong>
        <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
          {task.courseName}
        </span>
      </div>
      <p
        className={`m-0 text-xs font-semibold mt-1 ${getDeadlineColor(
          task.deadline
        )}`}
      >
        {formatDeadline(task.deadline)}
      </p>
    </li>
  );
};
