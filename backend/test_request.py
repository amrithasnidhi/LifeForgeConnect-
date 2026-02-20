"""Test the request_specific_donor endpoint directly."""
import traceback
from routes.blood import request_specific_donor, DonorRequestBody

body = DonorRequestBody(
    hospital_id="61e22ce5-97f5-43a0-97c8-17c551f05ea04",
    donor_id="8b8528fb-2b52-4ebb-8eb9-f68c5415cbd6",
    blood_group="A+",
    units=1,
    urgency="URGENT"
)

try:
    result = request_specific_donor(body)
    print("SUCCESS:", result)
except Exception as e:
    traceback.print_exc()
