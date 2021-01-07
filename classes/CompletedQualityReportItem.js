module.exports = class CompletedQualityReportItem {
    constructor(taskId, severity, messages) {
        this.taskId = taskId,
        this.taskStatus = "completed",
        this.taskSeverity = severity //warning, error, or success
        this.messages = messages
    };
}