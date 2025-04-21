# AI Code Review Service

This project is a Spring Boot application that listens to webhook events from Bitbucket and retrieves information about Pull Requests (PRs). The application's purpose is to extract relevant information from PRs and prepare it for automated AI-powered code review (using models like GPT) in the next development phases.

---

## Technologies Used

- Java 21
- Spring Boot 3.x
- Lombok
- Ngrok (for local tunneling)
- Bitbucket Cloud (for webhook integration)

---

## System Requirements

- Java 21 installed
- Maven installed
- Bitbucket account + existing repository
- Ngrok (https://ngrok.com/) installed and configured

---

## Project Structure

- `/src/main/java/com/review/reviewservice/controller/WebhookController.java`  
  → REST endpoint that receives webhook events from Bitbucket

- `/src/main/java/com/review/reviewservice/dto/BitbucketWebhookPayload.java`  
  → Data Transfer Object (DTO) that maps the JSON structure received from Bitbucket

---

## Setup Instructions

1. Clone the repository:

```bash
git clone https://bitbucket.org/antonrotaru/code-review-app.git
cd code-review-app
```

2. Run the Spring Boot application:

```bash
./mvnw spring-boot:run
```

3. Start Ngrok to expose port 8080:

```bash
ngrok http 8080
```

Copy the generated HTTPS URL (e.g., https://abc123.ngrok-free.app).

4. Configure a Webhook in Bitbucket:

- Go to Repository Settings → Webhooks → Add webhook
- URL:  
  `https://abc123.ngrok-free.app/webhook/bitbucket`
- Select triggers:
  - Pull Request: Created
  - Pull Request: Updated

---

## Testing

You can manually test the endpoint using Postman:

- Method: POST
- URL: `https://abc123.ngrok-free.app/webhook/bitbucket`
- Headers:
  - Content-Type: application/json
- Body (raw, JSON):

```json
{
  "pullrequest": {
    "id": 1,
    "title": "Test PR",
    "author": {
      "display_name": "Anton Rotaru"
    }
  },
  "repository": {
    "full_name": "antonrotaru/code-review-app"
  },
  "eventKey": "pr:opened"
}
```

If the application is properly configured, you will see the payload printed in the IntelliJ console.

---

## What the application does

Upon receiving a webhook, the application:

1. Accepts the JSON payload from Bitbucket.
2. Extracts the following information:
   - PR ID
   - PR Title
   - PR Author
   - Repository Name
   - Event Type (e.g., pr:opened)
3. Fetches the modified files and their contents from PR
4. Prints this information in the console.

---

## In Progress

The following features are under development:

- Sending code to GPT/AI for automated review
- Generating improvement suggestions

---

## Developers

- Anton Rotaru
- Eva Merculov
