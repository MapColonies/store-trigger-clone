# Store Trigger Service
The Store Trigger service is responsible for receiving requests and creating jobs in the Job Manager database. It supports both NFS (Network File System) and S3 (Simple Storage Service) models. Each job consists of a list of file paths that need to be synchronized.

### Functionality
The Store Trigger service performs the following steps:

Job Creation: Upon receiving a request, the service creates a new job in the Job Manager database. If the job creation is successful, it returns a 200 status code to the user.

File Path Extraction: The service reads all the file paths from the specified model. The model can be either NFS or S3. The number of file paths can be substantial, approximately 100,000.

Local File Write: The service writes the file paths extracted from the model to a local file. This step is performed to efficiently process the file paths and avoid overwhelming the system with individual requests.

Task Creation: The service reads the file paths from the local file and creates tasks based on them. Instead of sending thousands of requests to the Job Manager service for creating tasks, the service groups the file paths into batches.

Batch Requests: To control the concurrency and optimize performance, the service sends batch requests to the Job Manager service for creating tasks. The maximum concurrency request number can be adjusted using the 'maxConcurrency' parameter in the configuration.

Task Configuration: Each task created by the service contains a batch of file paths. The file paths are divided into batches based on the batch number specified in the configuration.

## API
Checkout the OpenAPI spec [here](/openapi3.yaml)

## Installation

Install deps with npm

```bash
npm install
```
### Install Git Hooks
```bash
npx husky install
```

## Run Locally

Clone the project

```bash

git clone https://link-to-project

```

Go to the project directory

```bash

cd my-project

```

Install dependencies

```bash

npm install

```

Start the server

```bash

npm run start

```

## Running Tests

To run tests, run the following command

```bash

npm run test

```

To only run unit tests:
```bash
npm run test:unit
```

To only run integration tests:
```bash
npm run test:integration
```
