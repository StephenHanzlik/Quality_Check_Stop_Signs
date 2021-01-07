module.exports = class ImageViolation {
    constructor(taskId, error, messages, uuids) {
        this.taskId = taskId,
        this.severity = "error"
        this.error = error,
        this.uuids = messages
    };
}