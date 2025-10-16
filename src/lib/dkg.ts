import 'dotenv/config';
// @ts-ignore dkg.js is CommonJS
import DKG from 'dkg.js';

const DkgClient = new DKG({
    endpoint: process.env.DKG_ENDPOINT,
    port: process.env.DKG_PORT,
    blockchain: {
        name: process.env.DKG_BLOCKCHAIN_ID,
        privateKey: process.env.DKG_PRIVATE_KEY,
    },
    maxNumberOfRetries: 300,
    frequency: 2,
    contentType: 'all',
    nodeApiVersion: '/v1',
});

export type UserKAInput = {
  userId: string;
  email?: string | null;
  walletAddress?: string | null;
};

export type PublishResult = { ual: string; txHash?: string };

export async function createKnowledgeAsset(content: any, epochsNum = 6) {
    // Optionally, increase allowance once for faster publishes:
    await DkgClient.asset.increaseAllowance('1569429592284014000');
    
    console.log('Publishing Knowledge Asset...', content);
    const result = await DkgClient.asset.create(content, {
        epochsNum: 2,
        minimumNumberOfFinalizationConfirmations: 3,
        minimumNumberOfNodeReplications: 1,
    });

    console.log('Success! Your Knowledge Asset has been published:');
    console.log(JSON.stringify(result, null, 2));

    return result; // contains UAL, operation info, signatures, etc.
}

export async function retrieveKnowledgeAsset(ual: string) {

    console.log('Querying for your Knowledge Asset...');

    try {
        const queryResult = await DkgClient.graph.get(ual);
        console.log('Found your Knowledge Asset!');
        console.log(JSON.stringify(queryResult, null, 2));
        return queryResult;
    } catch (error) {
        console.error("Error querying the asset:", error);
        console.log("Tip: Make sure the name in your query matches the name you used when publishing!");
    }
}

export interface PersonLD {
  '@context': 'https://schema.org';
  '@type': 'Person';
  '@id': string;
  'email'?: string;
  'walletAddress'?: string;
  // add other known fields as needed
}


