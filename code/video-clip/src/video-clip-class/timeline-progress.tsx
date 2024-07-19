/** 视频进度条 */
interface TimelineProgressProps {
  onPreviewTIme: (time: number) => void;
  playing: boolean;
}
export function TimelineProgress(props: TimelineProgressProps) {
  const { onPreviewTIme, playing } = props;
  return <div></div>;
}
