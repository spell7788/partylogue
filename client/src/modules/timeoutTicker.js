class TimeoutTicksEventTarget extends EventTarget {
  tick(remainingTicksNum) {
    this.dispatchEvent(
      new CustomEvent('tick', { detail: { remainingTicksNum } }),
    );
  }
}

export const timeoutTicksEmitter = new TimeoutTicksEventTarget();

export class TimeoutTicker {
  constructor(timeout, tickInterval = 1000) {
    this.timeout = timeout;
    this.tickInterval = tickInterval;
    this.remainingTicksNum = Math.ceil(this.timeout / this.tickInterval);
  }

  run(onTick, onClear) {
    timeoutTicksEmitter.tick(this.remainingTicksNum);
    onTick(this);
    this.timer = setInterval(() => {
      this.remainingTicksNum -= 1;
      if (this.remainingTicksNum < 0) {
        this.clear();
        onClear(this);
        return;
      }

      timeoutTicksEmitter.tick(this.remainingTicksNum);
    }, this.tickInterval);
  }

  clear() {
    if (!this.timer) return;
    clearInterval(this.timer);
  }
}

export default TimeoutTicker;
