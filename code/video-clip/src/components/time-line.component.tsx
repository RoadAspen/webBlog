import {
  Timeline,
  TimelineAction,
  TimelineRow,
  TimelineState,
} from "@xzdarcy/react-timeline-editor";
import { useState } from "react";

export type TLActionWithName = TimelineAction & { name?: string };

export const TimelineEditor = ({
  timelineData,
  timelineState,
  onPreviewTime,
  onOffsetChange,
  onDuraionChange,
  onDeleteAction,
  onSplitAction,
}: {
  timelineData: TimelineRow[];
  timelineState: React.MutableRefObject<TimelineState | undefined>;
  onPreviewTime: (time: number) => void;
  onOffsetChange: (action: TimelineAction) => void;
  onDuraionChange: (args: {
    action: TimelineAction;
    start: number;
    end: number;
  }) => void;
  onDeleteAction: (action: TimelineAction) => void;
  onSplitAction: (action: TLActionWithName) => void;
}) => {
  console.log("timelineData", timelineData);
  console.log("timelineState", timelineState);
  const [scale, setScale] = useState(1);
  const [activeAction, setActiveAction] = useState<TLActionWithName | null>(
    null
  );
  return (
    <div className="">
      <div>
        <span className="ml-[10px]">缩放：</span>
        <button
          onClick={() => setScale(scale + 1)}
          className="border rounded-full"
        >
          -
        </button>
        <button
          onClick={() => setScale(scale - 1 > 1 ? scale - 1 : 1)}
          className="border rounded-full"
        >
          +
        </button>
        <span className="mx-[10px]">|</span>
        <button
          disabled={activeAction == null}
          className="mx-[10px]"
          onClick={() => {
            if (activeAction == null) return;
            onDeleteAction(activeAction);
          }}
        >
          删除
        </button>
        <button
          disabled={activeAction == null}
          className="mx-[10px]"
          onClick={() => {
            if (activeAction == null) return;
            onSplitAction(activeAction);
          }}
        >
          分割
        </button>
      </div>
      <Timeline
        ref={(v) => {
          if (v == null) return;
          timelineState.current = v;
        }}
        onChange={(d) => {
          console.log("d", d);
        }}
        style={{ width: "100%", height: "200px" }}
        scale={scale}
        editorData={timelineData}
        effects={{}}
        scaleSplitCount={5}
        onClickTimeArea={(time) => {
          onPreviewTime(time);
          return true;
        }}
        onCursorDragEnd={(time) => {
          onPreviewTime(time);
        }}
        onActionResizing={({ dir, action, start, end }) => {
          if (dir === "left") return false;
          return onDuraionChange({ action, start, end });
        }}
        onActionMoveEnd={({ action }) => {
          onOffsetChange(action);
        }}
        onClickAction={(_, { action }) => {
          setActiveAction(action);
        }}
        getActionRender={(action: TLActionWithName) => {
          const baseStyle =
            "h-full justify-center items-center flex text-white";
          if (action.id === activeAction?.id) {
            return (
              <div
                className={`${baseStyle} border border-red-300 border-solid box-border`}
              >
                {action?.name}
              </div>
            );
          }
          return <div className={baseStyle}>{action.name}</div>;
        }}
        autoScroll
      />
    </div>
  );
};
