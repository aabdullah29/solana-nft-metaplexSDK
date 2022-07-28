// node --experimental-json-modules ./app.js

// const {  Metaplex, keypairIdentity, bundlrStorage } = require("@metaplex-foundation/js");
// const {  Connection, clusterApiUrl, Keypair , PublicKey} = require("@solana/web3.js");

import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair, PublicKey} from "@solana/web3.js";
import fs from 'mz/fs.js';
const readFile = async (input) => {
    return await fs.readFile(input, {encoding: 'utf8'});
}


// const wallet = Keypair.generate();
// import wallet_file from './wallet.json' ;//assert {type: "json"};
// import { readFile } from 'fs/promises';
// const json = JSON.parse(await readFile(new URL('./wallet.json', import.meta.url)));

const wallet_file = await readFile('./wallet/wallet.json');
const wallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(wallet_file)));
// console.log('=====> wallet:', wallet)

const connection = new Connection(clusterApiUrl("devnet"));
const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    // .use(bundlrStorage());
    .use(bundlrStorage({
        address: 'https://devnet.bundlr.network',
        providerUrl: 'https://api.devnet.solana.com',
        timeout: 60000,
    }));

// console.log('=====> metadata: ', metaplex, '\n\n')





// 1: accepts a mint public key (nft public) and returns nft object
const findByMint = async(metaplex, mintID) => {
    const mint = new PublicKey(mintID);
    const nft = await metaplex.nfts().findByMint(mint);
    console.log('=====> nft: ', nft, '\n\n');

    const imageUrl = nft.metadata.image;
    const supply = nft.originalEdition.supply;
    const maxSupply = nft.originalEdition.maxSupply;
    console.log('=====> findByMint: ', imageUrl, ' ',  supply.toString(), ' ', maxSupply.toString(), '\n\n');
}


// 2: accepts an array of mint addresses and returns an array of Nfts
// but nfts will not have their JSON metadata nor their edition account loaded
const findAllByMintList = async(metaplex, mintIDs) => {
    const mintA = new PublicKey(mintIDs[0]);
    const mintB = new PublicKey(mintIDs[1]);
    const [nft, nftB] = await metaplex.nfts().findAllByMintList([mintA, mintB]);
    
    console.log('=====> findAllByMintList: ', nftB, '\n\n');

    await nft.metadataTask.run();
    // await nft.EditionTask.run();
    if (nft.isOriginal()) {
        const currentSupply = nft.originalEdition.supply;
        const maxSupply = nft.originalEdition.maxSupply;
        console.log('====> currentSupply: ', currentSupply, '\t maxSupply: ', maxSupply);
    }
    
    if (nft.isPrint()) {
      const parentEdition = nft.printEdition.parent;
      const editionNumber = nft.printEdition.edition;
      console.log('======> parentEdition: ', parentEdition, '\t editionNumber', editionNumber);
    }
}


// 3: accepts a public key and returns all Nfts owned by that public key
// but nfts will not have their JSON metadata nor their edition account loaded
const findAllByOwner = async(metaplex, owner_publicKey) => {
    // const myNfts = await metaplex.nfts().findAllByOwner(metaplex.identity().publicKey);
    const myNfts = await metaplex.nfts().findAllByOwner(owner_publicKey);
    console.log('=====> findAllByOwner: ', myNfts.length, '\n\n');

}


// 4: accepts a public key and returns all Nfts that have that public key registered as their first creator
// but nfts will not have their JSON metadata nor their edition account loaded
const findAllByCreator = async(metaplex, creatorPublicKey) => {
    const nft1 = await metaplex.nfts().findAllByCreator(creatorPublicKey);
    // const nft2= await metaplex.nfts().findAllByCreator(creatorPublicKey, 1); // Equivalent to the previous line.
    // const nft3 = await metaplex.nfts().findAllByCreator(creatorPublicKey, 2); // Now matching the second creator field.
}


// 5: accepts the public key of a Candy Machine and returns all Nfts that have been minted from that Candy Machine(by candy machine id)
// but nfts will not have their JSON metadata nor their edition account loaded
const findAllByCandyMachine = async(metaplex , cm_publicKey) => {
    // const nft1 = await metaplex.nfts().findAllByCandyMachine(candyMachinePublicKey);
    const nft = await metaplex.nfts().findAllByCandyMachine(cm_publicKey);
    // const nft2 = await metaplex.nfts().findAllByCandyMachine(cm_publicKey, 2); // Equivalent to the previous line.
    // const nft3 = await metaplex.nfts().findAllByCandyMachine(cm_publicKey, 1); // Now finding NFTs for Candy Machine v1.

    console.log('=====> getNft_findAllByCandyMachine: ', nft, '\n\n');
}




// 6: create metadata uri for the nft metadata
const uploadMetadata = async(metaplex) => {
    const { uri } = await metaplex.nfts().uploadMetadata({
        name: "NFT july 15 7:30",
        Symbol: "MN",
        description: "My description of the metaplex nfts file",
        image: "https://img.freepik.com/free-vector/nft-non-fungible-token-non-fungible-tokens-icon-covering-concept-nft-high-tech-technology-symbol-logo-vector_208588-2005.jpg?w=2000",
    });
    
    console.log('=====> setNft_uploadMetadata: ', uri, '\n\n');
    return uri;
}


// 7: create new nft after creating metadata
const create_nft = async(metaplex) => {
    const { nft } = await metaplex.nfts().create({
        uri: await uploadMetadata(metaplex
            ),
        // uri: "https://ls3cbsrrce2el32w4uwf2kri3c6rbuxi4x2rsl4dzhveomkvo4.arweave.net/XLYgyjERNEXvVuUsXSoo2L0Q0ujl9Rkvg8_nqRzFVd8/",
        isMutable: true,
        maxSupply: 10,
        sellerFeeBasisPoints: 1500,
    });
    
    console.log('=====> setNft_create: ', nft, '\n\n');
}


//8: return the last nft from a wallet address
async function get_my_nft(metaplex, wallet, nft_name){
    const myNfts = await metaplex.nfts().findAllByOwner(wallet.publicKey);
    console.log('=====> get my Nft findAllByOwner: ', myNfts.length, '\n\n');
    for(let nft of myNfts){
        if (nft.name == nft_name)
        {
            nft = await metaplex.nfts().findByMint(nft.mint);
            console.log('=====> get my Nft findByMint: ', nft, '\n\n********************************************\n\n');
            return nft;
        }
    }
    // const nft = await metaplex.nfts().findByMint(myNfts[myNfts.length-1].mint);
    // console.log('=====> get my Nft findByMint: ', nft, '\n\n********************************************\n\n');

    return null;
}


// 9: update the nft detail and their metadata (by new uri)
const update_nft = async(metaplex, my_nft) => {

    const { nft: updatedNft } = await metaplex.nfts().update(my_nft, {
        name: "NFT (28 jun 1:15pm)",
        maxSupply: 100,
        isMutable: true,
        uri: await uploadMetadata(metaplex),
        sellerFeeBasisPoints: 1000,
    });


    // const { nft: updatedNft } = await metaplex.nfts().update(nft, {
    //     uri: newUri,
    // });
    
    // console.log('=====> setNft_update: nft: ', nft, '\n\n');
    console.log('=====> setNft_update: updatedNft: ', updatedNft, '\n\n');
}



// 10: create new print edition of an existing nft or from master edition
const printNewEdition = async(metaplex, my_nft) => {

    const { nft: printedNft } = await metaplex.nfts().printNewEdition(my_nft.mint);
    console.log('=====> setNft_printNewEdition: ', printedNft, '\n\n');
}



async function main_set(){
    // await findByMint(metaplex, "8kzRZtRSGcHDJTfrCKsZfa2neohNGEFYdf7mWvKdx2YB");
    // await findAllByMintList(metaplex, ["8kzRZtRSGcHDJTfrCKsZfa2neohNGEFYdf7mWvKdx2YB", "8kzRZtRSGcHDJTfrCKsZfa2neohNGEFYdf7mWvKdx2YB"]);
    // await findAllByOwner(metaplex, wallet.publicKey);
    // await findAllByCreator = async(metaplex, creatorPublicKey);
    // await findAllByCandyMachine(metaplex, new PublicKey('2ocxydUmMj1r2HWU18GYhreKMrpyhpDqUz1xm348RPvh'));


    // await uploadMetadata(metaplex);
    // await create_nft(metaplex);
    await get_my_nft(metaplex, wallet, "NFT jun 28 4:20");
    // await update_nft(metaplex, await get_my_nft(metaplex, wallet, "NFT jun 28 4:20"));
    // await printNewEdition(metaplex, await get_my_nft(metaplex, wallet, "NFT jun 28 4:20"));

}


main_set();






