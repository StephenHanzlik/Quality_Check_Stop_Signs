const scaleapi = require('scaleapi');
const client = scaleapi.ScaleClient(process.env['SCALE_API_KEY']);
const QualityReportTaskItem = require('./QualityReportTaskItem');

getCompletedTasksFromScale = async (nextToken) => {
    let completedTaskResponses = [];
    const params = {"status": "completed"};
    if(nextToken) params["next_token"] = nextToken;

    const completedTasks = await new Promise(resolve => {
        console.log("Retrieving completed tasks for Scale...")
        client.tasks(params, (err, taskList) => {
            nextToken = taskList['next_token'];
            resolve(taskList.docs);
        });
    });
    completedTasks.forEach(task => completedTaskResponses.push(task));
    return (nextToken ? await getCompletedTasksFromScale(nextToken) : completedTaskResponses);
}

getTaskResponsesFromScale = async () => {
    // Get all the tasks that have been completed
    let completedTasks = await getCompletedTasksFromScale();
    let qualityReportBody = [];
    completedTasks.forEach(task=>{
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
            // qualityReportItem.warnings.sameSizeBoxes = annotationsWarningsWithMatchingSize;

            // Search for Traffic Control Sign annotations that have a color that is not "other" or "not_applicable"
            validateTrafficControlColor(staticAnnotation, annotationWarningsTrafficControlColor);
            // qualityReportItem.warnings.trafficControlColor = annotationWarningsTrafficControlColor;

            // Search for the annotations that exceed minimum and max values and create either errors or warnings.
            findMinAndMaxBoxSizeAnnotations(staticAnnotation, annotationErrorsThatExceedMaxAndMinSize, annotationWarningsThatExceedMaxAndMinSize); 
            // qualityReportItem.warnings.imageConstraintsExceeded = annotationWarningsThatExceedMaxAndMinSize;
            // qualityReportItem.errors.imageConstraintsExceeded = annotationErrorsThatExceedMaxAndMinSize;

            // Search for annotations that have truncation values that are not compatible with image size, x/y values, and width/height values.
            // validateTruncation(); // Would impliment this with more time

            qualityReportItem = new QualityReportTaskItem(task.id, annotationsWarningsWithMatchingSize, annotationWarningsTrafficControlColor, 
                annotationWarningsThatExceedMaxAndMinSize, annotationErrorsThatExceedMaxAndMinSize);


        }
        if(qualityReportItem){
            qualityReportBody.push(qualityReportItem);
        }
        
        // completedTaskQualityReport.push(new CompletedQualityReportItem(task.id, "warning", "sample message"))
    })
    console.log("completedTaskQualityReport", JSON.stringify(qualityReportBody));
    // const qualityReportBody = new QualityReportBody(completedTaskQualityReport)
}

findSameSizeAnnotations = (staticAnnotation, taskAnnotations, i, annotationsWarningsWithMatchingSize) => {
    for (let j = i+1; j <= taskAnnotations.length - 1; j++) {
        const itterableAnnotation = taskAnnotations[j];
        if(isBoxSameSize(itterableAnnotation, staticAnnotation)){
            if(!boxHasBeenFound(itterableAnnotation, annotationsWarningsWithMatchingSize)){
                annotationsWarningsWithMatchingSize.push(itterableAnnotation);
            }
            if(!boxHasBeenFound(staticAnnotation, annotationsWarningsWithMatchingSize)){
                annotationsWarningsWithMatchingSize.push(staticAnnotation);
            } 
        }
    }
}

isBoxSameSize = (itterableAnnotation, staticAnnotation) => {
    return itterableAnnotation.width === staticAnnotation.width && itterableAnnotation.height == staticAnnotation.height;
}

hasEitherBoxesAlreadyBeenFound = (itterableAnnotation, staticAnnotation, annotationsWarningsWithMatchingSize) => {
    return annotationsWarningsWithMatchingSize.indexOf(itterableAnnotation) > -1 || annotationsWarningsWithMatchingSize.indexOf(staticAnnotation) > -1
}

boxHasBeenFound = (annotation, annotationsWarningsWithMatchingSize) => {
    return annotationsWarningsWithMatchingSize.indexOf(annotation) > -1
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
    if(annotation.label === 'traffic_control_sign'){
        const color = annotation.attributes.background_color;
        if(color != 'not_applicable' && color != 'other'){
            annotationWarningsTrafficControlColor.push(annotation);
        }
    }
}

validateTruncation = () => {

}

// validateAnnotations = (annotations, taskId) => {
//     annotations.forEach(annotation=>{
//         // validateBoxSize(annotation); //handles both max 1) and min 2)
//         // validateTrafficControlColor(annotation); //handles 3)

//         // validateTruncation(); //handles 4)
//         validateOverlappingImages(annotation, taskId); //handles 5)
//     })
// }





// Expects the JSON format from the GET /v1/tasks endpoint
// getTaskResponsesFromLocalJson = () => {
//     let erroredTasksQualityReport = [];
//     let completedTaskQualityReport = [];
//     allTasks = localTaskResponses.docs;
//     tasksWithResponses = allTasks.filter(task=>task.status === "completed" || task.status === "error");
//     tasksWithResponses.forEach(task=>{
//         if(task.status === "completed"){
//             completedTaskQualityReport.push(buildCompletedJsonReportBody(task));
//         }else{
//             erroredTasksQualityReport.push(buildErroredJsonReportBody(task));
//         }
//     })
//     const qualityReportBody = new QualityReportBody(erroredTasksQualityReport, completedTaskQualityReport)
//     console.log("Errored Tasks: ", qualityReportBody);
// }

//Prompt:  Welcome to the Qaulity Report script. Do you want to fetch reports from Scale or provide hard coded JSON?  (enter: Scale or JSON)
//if Scale
getTaskResponsesFromScale();//inputs should include queries
//if JSON
//getTaskResponsesFromLocalJson();

// Focus on the truncation value and the left, top, width, and height values.  
// Truncation is how far off the screen an item is.  left and top are the disctnace in pixels between the bounding box and end of image
// width and height are of the bounding box.

//1) Max size check - throw a warn if H or W exceed 100
// Possible Quality check item for 5f127f5f3a6b100017232099 - https://dashboard.scale.com/audit?taskId=5f127f5f3a6b100017232099
// Problem a large area is anotated that has no traffic signals.  It has measurements W 518 H 654 and there is nothing there.  How do we find out what large is?
// For example with task 5f127f6f26831d0010e985e5 - https://dashboard.scale.com/audit?taskId=5f127f6f26831d0010e985e5 we see a relatively large billboard (albeit at a distance)
// that only has the dimensions W 114 H 100.  It seems reasonable that large should be considered W 100 H 100, a bit arbitraty but if we want sensative "warning" logic we 
// should have a low threshold for all items above these dimensions.
// This would also catch task 5f127f5ab1cb1300109e4ffc - https://dashboard.scale.com/audit?taskId=5f127f5ab1cb1300109e4ffc.  We should look for any time either W 100 or H 100 
// are exceeded.  Here we have a the measurements W 79 H 117 and these should have actually been broken out into two different signs per the requirment 
// "Signs should be individually labeled"
// It also would catch this issue with too large of a box around 5f127f55fdc4150010e37244 - https://dashboard.scale.com/audit?taskId=5f127f55fdc4150010e37244 with 
// Dimensions W 205 H 44

// 2) Min size check - throw a warn if the H and W are below 4
// This would have caught the issue with 5f127f55fdc4150010e37244 - https://dashboard.scale.com/audit?taskId=5f127f55fdc4150010e37244.  The problem here is someone added 
// a bunch of small boxes for traffic_control_sign that don't really contain anything.  

// 3) Check the color on traffic_control_signs
// traffic_control_signs are supposed to be "color": "other" if they are not disernable or its the back side of it.  When reviewing the data most have "other" or "not_applicalb"
// We could throw a soft "warn" for any of these that have color. For example, task 5f127f699740b80017f9b170 - https://dashboard.scale.com/audit?taskId=5f127f699740b80017f9b170 
//failed due to the false presence of traffic_control_sign (s).  The color in this case is "red" even though the customer says there is 
// nothing there and that these are mislabelled.  

// 4) Check truncation in relation to the edge of the image
// Task 5f127f5f3a6b100017232099 - https://dashboard.scale.com/audit?taskId=5f127f5f3a6b100017232099 item traffic_control_sign6ad6 has truncation at 
// 50% but this object is not off of the screen nor is it occluded.  We should be able to use the coordinates X 856 Y 26 W 41 H 52 and the size of the image to see
// that it is not off of the screen at all.  For example, item information_signe8ac also is effected by truncation but is not marked as such we should be able to
// figure it out with the coordinates  1179 Y 55 W 146 H 109.  The docs for boxes show this definition:
//          left float - The distance, in pixels, between the left border of the bounding box and the left border of the image.
//          top	float - The distance, in pixels, between the top border of the bounding box and the top border of the image.

// 5) Overlapping signs 
// Task 5f127f671ab28b001762c204 - https://dashboard.scale.com/audit?taskId=5f127f671ab28b001762c204 has overlapping signs.
// We can check for this by looking at the coordinates and dimensions and makings sure they are not too close.
// the three information_signs for "Montgomery Post" have the following values.
//X 479 Y 475 W 107 H 105
//X 478 Y 477 W 107 H 105
//X 478 Y 476 W 107 H 105

//5f127f5ab1cb1300109e4ffc - https://dashboard.scale.com/audit?taskId=5f127f5ab1cb1300109e4ffc has a stopsign marked as blue and a information sign
// marked as one when it is really two.  How can we check for these?