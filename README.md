## Quality Check
This is a Node.js script to extract tasks from the Scale API and perform a set of basic quality checks.  It requires a Scale API Key to be stored as an environment variable with the name `SCALE_API_KEY` and outputs a JSON file named `qualityReport.json`.  NOTE: This script pages through all tasks in a given Scale account, with a 5 second wait between each call, until a `next_token` is no longer returned.  Be careful if this is pointed at an account with many tasks and the 5 second delay (with default page size of 100) does not satisfy concerns about rate limiting. 
 
 ## Run
 From the `Quality_Check_Stop_Signs` directory type `node qualityCheck` in the console.
