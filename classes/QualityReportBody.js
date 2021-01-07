module.exports = class QualityReportBody {
    constructor(succesfulTasks, warningTasks, erroredTasks) {
        this.successCount = succesfulTasks.length,
        this.warningCount = warningTasks.length,
        this.errorCount = erroredTasks.length,
        this.successfulTasks = succesfulTasks,
        this.warningTasks = warningTasks,
        this.erroredTasks = erroredTasks 
    };
}