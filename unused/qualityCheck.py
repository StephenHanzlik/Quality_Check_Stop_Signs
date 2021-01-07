# Signs relating to a mode of transportation (including walking) should be annotated. 
# Signs for commercial activity, events, or non-travel related signs should be excluded.

# Your script should be able to take in a list of task ids/responses and generate an output
# for them. While there are only 8 tasks in this demo account, imagine we’d want to use
# the same script / function on the set of 250k images they’d want to be labeled. (i.e.
# don’t hard-code things for specific tasks, etc.)

# As an example quality check, if a task has a bounding box taking up the entire image,
# that’s probably not great. There are many such checks that could be helpful.

# If helpful, it may be useful to come up with an escalation severity such as “warning” for
# things that seem risky but could be OK and “error” for things that we’re almost certain
# would be invalid.

# import sys

# print('Total number of arguments: ', len(sys.argv))
# print('The arguments: ', sys.argv)

import requests
import os
import json

api_key = os.environ.get('SCALE_API_KEY')
# url = "https://api.scale.com/v1/tasks"
# querystring = {"customer_review_status":"","limit":"100"}

# response = requests.get( 
#     url, 
#     params=querystring,
#     headers={"Content-Type": "application/json"},
#     auth=(api_key, ""),
# )
# print(response.json())

# We are probably ingesting these via a call back.  However, given a list of all tasks retrievedf 
import scaleapi

client = scaleapi.ScaleClient(api_key)
task_id = 'YOUR_TASK_ID'

tasklist = client.tasks(
  customer_review_status = ""
)
print(json.dumps(tasklist))

# for task in tasklist:
#     print(task.id)
#     print(tasklist[task.id])
