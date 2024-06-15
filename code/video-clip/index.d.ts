interface FileSystemWritableFileStream extends WritableStream<Uint8Array> {
  write(data: Uint8Array): Promise<void>;
}

declare interface Window {
  showSaveFilePicker: any;
}
