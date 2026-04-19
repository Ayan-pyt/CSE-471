require('dotenv').config();
const { AffindaAPI, AffindaCredential } = require('@affinda/affinda');

const credential = new AffindaCredential(process.env.AFFINDA_API_KEY);
const client = new AffindaAPI(credential);

async function test() {
  try {
    const orgId = "SptfJblY";
    const workspaceId = "YjHedqJD";
    
    // Create resume collection
    console.log("Creating resume collection...");
    const collection = await client.createCollection(orgId, workspaceId, {
      name: "Resumes",
      extractor: "resume"
    });
    console.log("SUCCESS! Collection ID:", collection.identifier);
  } catch (err) {
    console.error("Test Error:", err);
  }
}
test();
