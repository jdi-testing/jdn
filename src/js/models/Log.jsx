import {action, observable} from "mobx";

export default class Log {
  @observable log;

  constructor() {
    this.log = [];
  }

  isEmpty() {
    return this.log.length === 0;
  }

  @action
  addToLog({ message, type }) {
    const date = new Date();
    this.log.push({ message, type, time: date });
  }

  @action
  clearLog() {
    this.log = [];
  }
}
