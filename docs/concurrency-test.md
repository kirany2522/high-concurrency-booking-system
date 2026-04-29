# Concurrency Test (Postman Runner)

## Setup
- Tool: Postman Runner
- Iterations: 50 requests
- Target: POST /book
- Same seat ID used for all requests

## Result
- Successful bookings: 1
- Failed requests: 49 (409 Conflict)

## Observation
- Redis lock prevented multiple simultaneous bookings
- Database allowed only one successful transaction
- No double booking occurred

## Conclusion
System is safe against race conditions under concurrent load.