import { pull } from "lodash";
import { GET_TASK_RESULT, GET_TASK_STATUS, request, SHEDULE_XPATH_GENERATION } from "./backend";

export const locatorProgressStatus = {
  PENDING: "PENDING",
  REVOKED: "REVOKED",
  STARTED: "STARTED",
};

export const locatorTaskStatus = {
  FAILURE: "FAILURE",
  RECEIVED: "RECEIVED",
  RETRY: "RETRY",
  SUCCESS: "SUCCESS",
  ...locatorProgressStatus,
};

export class LocatorGenerationScheduler {
  constructor(elementId, settings, document, callback) {
    this.elementId = elementId;
    this.settings = settings;
    this.statusCallback = callback;
    this.document = document;
    this.taskStatus = null;
    this.ping = null;
    this.requestInProgress = false;

    this.scheduleGeneration();
  };

  async scheduleGeneration() {
    const result = await request.post(SHEDULE_XPATH_GENERATION, JSON.stringify({
      document: this.document,
      id: this.elementId,
      config: this.settings,
    }));
    this.taskId = result.task_id;
    this.statusCallback(this.elementId, {taskStatus: locatorTaskStatus.PENDING});
    this.runStatusChecker();
  }

  async runStatusChecker() {
    this.ping = setInterval(this.checkTaskStatus.bind(this), 1000);
  }

  async getTaskResult() {
    const result = await request.post(GET_TASK_RESULT, JSON.stringify({
      id: this.taskId,
    }));
    this.statusCallback(this.elementId, {taskStatus: locatorTaskStatus.SUCCESS, robulaXpath: result.result});
  }

  async checkTaskStatus() {
    if (this.requestInProgress) return;

    this.requestInProgress = true;
    const result = await request.post(GET_TASK_STATUS, JSON.stringify({
      id: this.taskId,
    }));
    this.taskStatus = result.status;
    this.requestInProgress = false;

    if (!locatorProgressStatus.hasOwnProperty(this.taskStatus)) {
      clearInterval(this.ping);
      locatorGenerationController.unscheduleTask(this.elementId);
    }
    if (this.taskStatus === locatorTaskStatus.SUCCESS) {
      this.getTaskResult();
    } else {
      this.statusCallback(this.elementId, {taskStatus: this.taskStatus});
    }
  }
};

class LocatorGenerationController {
  constructor() {
    this.scheduledGenerations = [];
  }

  scheduleTask(elementId, settings, document, callback) {
    if (this.scheduledGenerations.includes(elementId)) return;

    this.scheduledGenerations.push(elementId);
    new LocatorGenerationScheduler(elementId, settings, document, callback);
  }

  unscheduleTask(elementId) {
    pull(this.scheduledGenerations, elementId);
  }
}

export const locatorGenerationController = new LocatorGenerationController();
