module.exports = class QualityReportTaskItem {
    constructor(taskId, sameSizeBoxes = [], trafficControlColor = [], warningsImageConstraints = [], errorsImageConstraints = []) {
        this.task = taskId,
        this.warnings = {
            "sameSizeBoxes": sameSizeBoxes,
            "trafficControlColor": trafficControlColor,
            "imageConstraintsExceeded": warningsImageConstraints

        },
        this.errors = {
            "imageConstraintsExceeded": errorsImageConstraints
        }
    };
}