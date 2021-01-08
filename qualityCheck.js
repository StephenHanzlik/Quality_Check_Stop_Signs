const scaleapi = require('scaleapi');
const fs = require("fs");
const client = scaleapi.ScaleClient(process.env['SCALE_API_KEY']);
const QualityReportTaskItem = require('./classes/QualityReportTaskItem');

getTasksFromScale = async (nextToken) => {
    let completedTaskResponses = [];
    const params = {"status": "completed"};

    if(nextToken) {
        params["next_token"] = nextToken;
        await pause(5000);
    }

    const completedTasks = await new Promise(resolve => {
        console.log("Retrieving completed tasks from Scale...")
        client.tasks(params, (err, taskList) => {
            nextToken = taskList['next_token'];
            resolve(taskList.docs);
        });
    });
    completedTasks.forEach(task => completedTaskResponses.push(task));
    return (nextToken ? await getTasksFromScale(nextToken) : completedTaskResponses);
}

pause = (milliseconds) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(milliseconds)
      }, milliseconds )
    })
} 

qualityCheck = async () => {
    // Get all the tasks that have been completed
    let completedTasks = await getTasksFromScale();
    let qualityReportBody = [];
    await completedTasks.forEach(task=>{
        let taskAnnotations = task.response.annotations;
        let qualityReportItem;
        let annotationsWarningsWithMatchingSize = [];
        let annotationErrorsThatExceedMaxAndMinSize = [];
        let annotationWarningsThatExceedMaxAndMinSize = [];
        let annotationWarningsTrafficControlColor = [];

        for (let i = 0; i <= taskAnnotations.length - 1; i++) {
            const staticAnnotation = taskAnnotations[i]
            // Search for annotations that are the same size and create warnings.
            findSameSizeAnnotations(staticAnnotation, taskAnnotations, i, annotationsWarningsWithMatchingSize);
            // Search for Traffic Control Sign annotations that have a color that is not "other" or "not_applicable"
            validateTrafficControlColor(staticAnnotation, annotationWarningsTrafficControlColor);
            // Search for the annotations that exceed minimum and max values and create either errors or warnings.
            findMinAndMaxBoxSizeAnnotations(staticAnnotation, annotationErrorsThatExceedMaxAndMinSize, annotationWarningsThatExceedMaxAndMinSize); 
            // Search for annotations that have truncation values that are not compatible with image size, x/y values, and width/height values.
            // validateTruncation(); // TODO: Impliment this with more time
            // Search for annotations that have occlusion values that are not compatible with x/y and width/height values
            // validateOcclusion(); // TODO: Impliment this with more time
            qualityReportItem = new QualityReportTaskItem(task.id, annotationsWarningsWithMatchingSize, annotationWarningsTrafficControlColor, 
                annotationWarningsThatExceedMaxAndMinSize, annotationErrorsThatExceedMaxAndMinSize);
        }
        if(qualityReportItem){
            qualityReportBody.push(qualityReportItem);
        }
    })
    writeToLocalJsonFile(qualityReportBody);
}

findSameSizeAnnotations = (staticAnnotation, taskAnnotations, i, annotationsWarningsWithMatchingSize) => {
    for (let j = i+1; j <= taskAnnotations.length - 1; j++) {
        const itterableAnnotation = taskAnnotations[j];
        if(isBoxSameSize(itterableAnnotation, staticAnnotation)){
            if(!boxHasAlreadyBeenFound(itterableAnnotation, annotationsWarningsWithMatchingSize)){
                annotationsWarningsWithMatchingSize.push(itterableAnnotation);
            }
            if(!boxHasAlreadyBeenFound(staticAnnotation, annotationsWarningsWithMatchingSize)){
                annotationsWarningsWithMatchingSize.push(staticAnnotation);
            } 
        }
    }
}

findMinAndMaxBoxSizeAnnotations = (annotation, annotationErrorsThatExceedMaxAndMinSize, annotationWarningsThatExceedMaxAndMinSize) => {
        const width = annotation.width;
        const height = annotation.height;
        // Validate maximum sizes 
        if(width >= 400 || height >= 400){
            annotationErrorsThatExceedMaxAndMinSize.push(annotation);
        }else if(width >= 150 || height >= 150){
            annotationWarningsThatExceedMaxAndMinSize.push(annotation);
        }
        // Validate minimum sizes
        if(width === 0 || height === 0){
            annotationErrorsThatExceedMaxAndMinSize.push(annotation);
        }else if(width <= 2 || height <= 2){
            annotationWarningsThatExceedMaxAndMinSize.push(annotation);
        }
};

validateTrafficControlColor = (annotation, annotationWarningsTrafficControlColor) => {
    // Validate the traffic_control_sign attribute for a color
    if(annotation.label === 'traffic_control_sign'){
        const color = annotation.attributes.background_color;
        if(color != 'not_applicable' && color != 'other'){
            annotationWarningsTrafficControlColor.push(annotation);
        }
    }
}

validateTruncation = () => {
    //TODO: validate that truncation values are practical given image size, x/y, and width/height values
}

validateOcclusion = () => {
    //TODO: validate that occlusion values are practical given x/y and width/height values
}


// Functions called in findSameSizeAnnotations()
isBoxSameSize = (itterableAnnotation, staticAnnotation) => {
    return itterableAnnotation.width === staticAnnotation.width && itterableAnnotation.height == staticAnnotation.height;
}

boxHasAlreadyBeenFound = (annotation, annotationsWarningsWithMatchingSize) => {
    return annotationsWarningsWithMatchingSize.indexOf(annotation) > -1
}

writeToLocalJsonFile = (json) => {
    const fileName = "./qualityReport.json";
    fs.writeFile(fileName, JSON.stringify(json), (err) => {
        if (err) {
            console.error(err);
            return;
        };
        console.log(`Your quality report is available at ${fileName}`);
    });
}

qualityCheck();//This invocation runs the whole script.
//TODO: add checking for truncation values
//TODO: add checking for occlusion values
//TODO: inputs should allow for queries of api by created_at and completed_at timestamps to limit results coming back.  As well as type, batch, and project.
    // sample values "created_at": "2016-06-23T08:51:13.903Z" / "completed_at": "2016-06-23T09:09:10.108Z"

