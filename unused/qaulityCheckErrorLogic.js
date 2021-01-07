const ErroredQualityReportItem = require('./ErroredQualityReportItem');

getErroredTasksFromScale = async (nextToken) => {
    let erroredTaskResponses = [];
    const params = {"status": "error"};
    if(nextToken) params["next_token"] = nextToken;

    const erroredTasks = await new Promise(resolve => {
        console.log("Retrieving errored tasks for Scale...")
        client.tasks(params, (err, taskList) => {
            nextToken = taskList['next_token'];
            resolve(taskList.docs);
        });
    });
    erroredTasks.forEach(task => erroredTaskResponses.push(task));
    return (nextToken ? await getErroredTasksFromScale(nextToken) : erroredTaskResponses);
}

buildErroredJsonReportBody = (task) => {
    const response = task.response;
    let frameMessages = [];
    response.frames.forEach(frame => {
        frameMessages.push(frame.message)
    })
    return new ErroredQualityReportItem(task.id, response.error, frameMessages);
}

getTaskResponsesFromScale = async () => {
    // Start by getting all the tasks with known errors
    let erroredApiTasks = await getErroredTasksFromScale();
    let erroredTasksQualityReport = [];
    erroredApiTasks.forEach(task=>{
        erroredTasksQualityReport.push(buildErroredJsonReportBody(task));
    });

    // Then get all the tasks that have been completed
    let completedTasks = await getCompletedTasksFromScale();
    let completedTaskQualityReport = [];
    completedTasks.forEach(task=>{
        //validate the task with customer parms
        completedTaskQualityReport.push(new CompletedQualityReportItem(task.id, "warning", "sample message"))
    })
    console.log("Completed Tasks: ", completedTasks.length);

    const qualityReportBody = new QualityReportBody(erroredTasksQualityReport, completedTaskQualityReport)
    console.log("Errored Tasks: ", qualityReportBody);
}