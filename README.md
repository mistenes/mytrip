

# Run and deploy the app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app frontend:
   `npm run dev`
3. Start the API server (requires MongoDB):
   `npm run server`

The server uses the `MONGODB_URI` environment variable and defaults to `mongodb://localhost:27017/mytrip`.
