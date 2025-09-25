import { CosmosClient } from "@azure/cosmos";
import { BlobServiceClient } from "@azure/storage-blob";

// Azure Cosmos DB configuration
const cosmosConfig = {
  endpoint: process.env.AZURE_COSMOS_ENDPOINT,
  key: process.env.AZURE_COSMOS_KEY,
  databaseId: process.env.AZURE_COSMOS_DATABASE_ID,
};

// Azure Blob Storage configuration
const blobConfig = {
  connectionString: process.env.AZURE_BLOB_CONNECTION_STRING,
  containerName: process.env.AZURE_BLOB_CONTAINER_NAME,
};

let cosmosClient: CosmosClient;
let blobServiceClient: BlobServiceClient;

function initializeAzure() {
  const hasMissingValues = Object.values({
    ...cosmosConfig,
    ...blobConfig,
  }).some((value) => !value);

  if (hasMissingValues) {
    console.error(
      "Azure config is missing in '.env.local'. Please update it with your actual credentials to connect to Azure."
    );
    return;
  }

  cosmosClient = new CosmosClient({
    endpoint: cosmosConfig.endpoint!,
    key: cosmosConfig.key!,
  });

  blobServiceClient = BlobServiceClient.fromConnectionString(
    blobConfig.connectionString!
  );
}

// Initialize Azure on module load
initializeAzure();

export { cosmosClient, blobServiceClient, initializeAzure };
