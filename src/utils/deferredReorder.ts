function scheduleWhenIdle(action: () => void): void {
  const ric = globalThis.requestIdleCallback;
  if (typeof ric === 'function') {
    ric(() => action(), { timeout: 150 });
    return;
  }
  setImmediate(action);
}

/** 드래그 애니메이션이 끝난 뒤 스토어 정렬을 적용해 드롭 끊김을 줄인다. */
export function runAfterDragAnimation(action: () => void): void {
  requestAnimationFrame(() => {
    scheduleWhenIdle(action);
  });
}
