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
    let index = Object.keys(inputData)[[Object.keys(inputData).length-1]];
    let link = await inputData[`${(index)}`]
    console.log('index:', ++index, ', link:', link, "\n\n");
    return {index, link}
}


/*
// get wallet keypair
*/
async function getWallet(){
    const wallet_file = await readFile('./wallet-nft.json');
    const wallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(wallet_file)));
    console.log('\nWallet PublicKey:', wallet.publicKey.toBase58())
    return wallet
}


/*
// create metaplex object
    for mainnet uncomment the line number 76 and 80, 81, 82
    and comment the line number 83 to 87
*/
async function getMetaplexObj(wallet){
    // const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const connection = new Connection(clusterApiUrl("devnet"));
    const metaplex = Metaplex.make(connection)
        .use(keypairIdentity(wallet))
        // .use(bundlrStorage({
        //     timeout: 60000,
        // }));
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
    if(link.length < 20){
        throw new Error('invalid uri.');
    }
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
    for (; index<11; index++) {
        try{
            // if (index % 2 === 0) {
            //     throw new Error('Exception through');
            // }
            if (index === 1 && checkIndexZeero){
                index--;
                const nft = await mintNFT(metaplex, link+index+linkEnd);
                await success(index, link, nft, outFileName);
                index++;
            }
            const nft = await mintNFT(metaplex, link+index+linkEnd);
            await success(index, link, nft, outFileName);
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
async function mintFailedList(metaplex, inputData, link, outFileName){
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

    /*
        For first time minting
    */
    try{
        inputData = await JSON.parse( await readFile('./files/result-success.json'));
    }catch(e){
        console.log("\n\n\nError in inputData File.\n\n")
    }
    await mintFirstTime(metaplex, inputData, "1st");



    /*
        after error mint the remaining items
        change file file name in third perameter

    */
    // let uri = undefined;
    // try{
    //     inputData = await JSON.parse( await readFile('./files/result-success.json'));
    //     const { index, link } = await getIndexAndLink(inputData);
    //     uri = link;
    //     inputData = await JSON.parse( await readFile('./files/input.json'));
    // }catch(e){
    //     console.log("\n\n\nError in inputData File.\n\n")
    // }
    // await mintFailedList(metaplex, inputData, uri, "2nd")
}

main();


