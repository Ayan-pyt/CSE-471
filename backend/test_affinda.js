require('dotenv').config();
const { AffindaAPI, AffindaCredential } = require('@affinda/affinda');
const fs = require('fs');
const path = require('path');

const credential = new AffindaCredential(process.env.AFFINDA_API_KEY);
const client = new AffindaAPI(credential);

async function test() {
  try {
    const filePath = path.join(__dirname, 'uploads', '69d746fbe2b627b86737cf53-1775717018995.pdf');
    const docStream = fs.createReadStream(filePath);
    
    // Explicitly pass the workspace so it uses the Resume Document Type
    const options = { file: docStream, workspace: process.env.AFFINDA_WORKSPACE_ID };
    
    const result = await client.createDocument(options);
    console.log("Raw SDK Skills:");
    console.log(JSON.stringify(result?.data?.skills, null, 2));
    
  } catch (err) {
    console.error("Test Error:", err);
  }
}
test();
