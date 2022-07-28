import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair, PublicKey} from "@solana/web3.js";
import fs from 'mz/fs.js';
let linkEnd = ".json";

/*
// read file from given path
*/
const readFile = async (fName) => {
    return await fs.readFile(fName, {encoding: 'utf8'});
}


/*
// write file to given path
*/
const writeFile = async (fName, fContent) => {
    fs.writeFile(fName, fContent,  {'flag':'a'},  function(err) {
        if (err) {
            return console.error(err);
        }
    });
}


/*
// show success message and write in file
*/
async function success(index, link, nft, outFileName){
    if (index !== 0){
    writeFile(`./files/result-success.json`, `"${index}":"${link}",`);
    }
    writeFile(`./files/result-nft-details-${outFileName}.json`, `"${index}": ${JSON.stringify(nft)},\n\n`);
    console.log(index, ': success.')
}


/*
// show fail message and write in file
*/
async function fail(index, e, outFileName){
    writeFile(`./files/result-fail-${outFileName}.txt`, `${index},`);
    writeFile(`./files/result-error-${outFileName}.txt`, `${index}: ${e} \n\n`);
    console.log(index, ': fail.')
}


/*
// get the last index and link
*/
async function getIndexAndLink(inputData){
    const index = await Object.keys(inputData).length;
    const link = await inputData[`${(index-1)}`]
    return {index, link}
}


/*
// get wallet keypair
*/
async function getWallet(){
    const wallet_file = await readFile('./wallet-nft.json');
    const wallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(wallet_file)));
    console.log('\nWallet PublicKey:', wallet.publicKey.toBase58(), '\n\n')
    return wallet
}


/*
// create metaplex object
*/
async function getMetaplexObj(wallet){
    const connection = new Connection(clusterApiUrl("devnet"));
    const metaplex = Metaplex.make(connection)
        .use(keypairIdentity(wallet))
        // .use(bundlrStorage());
        .use(bundlrStorage({
            address: 'https://devnet.bundlr.network',
            providerUrl: 'https://api.devnet.solana.com',
            timeout: 60000,
        }));
        return metaplex;
}



/* 
// mint nft using metaplex object
*/
async function mintNFT(meta, link){
    console.log('=> mint-uri: ', link)
    const { nft } = await meta.nfts().create({
        uri: link,
        isMutable: false,
        maxSupply: 0,
        // sellerFeeBasisPoints: 1500,
    });
    return nft;
}


/*
// mint from last index given in success file
*/
async function mintFirstTime(metaplex, inputData, outFileName){
    let {index, link} = await getIndexAndLink(inputData);

    let checkIndexZeero = true;
    for (; index<3; index++) {
        try{
            if (index === 1 && checkIndexZeero){
                index--;
                const nft = await mintNFT(metaplex, link+index+linkEnd);
                await success(index, link, nft, outFileName);
                index++;
            }
            const nft = await mintNFT(metaplex, link+index+linkEnd);
            await success(index, link, nft, outFileName);
            // throw new Error('Exception message');
        }catch(e){
            await fail(index, e, outFileName);
            if(index === 0){
                checkIndexZeero = false;
            }
        }
    }    
}


/*
// mint the fail index given in fail file
*/
async function mintFailedList(metaplex, inputData, outFileName){
    const { link } = getIndexAndLink(inputData);
    for (let index of inputData) {
        try{
            const nft = await mintNFT(metaplex, link+index+linkEnd);
            await success(index, link, nft, outFileName);

        }catch(e){
            await fail(index, e, outFileName);
        }
    }  
}




/*
******** Main *********
*/
async function main(){
    const wallet = await getWallet();
    const metaplex = await getMetaplexObj(wallet);
    let inputData = undefined;
    try{
        inputData = await JSON.parse( await readFile('./files/result-success.json'));
    }catch(e){
        console.log("\n\n\nError in inputData File.\n\n", e)
    }
    
    await mintFirstTime(metaplex, inputData, "1st");

    // // change file file name in third perameter
    // const inputData = await JSON.parse( await readFile('./files/input.json'));
    // await mintFailedList(metaplex, inputData, "2nd")
}

main();


