import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair, PublicKey} from "@solana/web3.js";
import fs from 'mz/fs.js';


const readFile = async (fName) => {
    return await fs.readFile(fName, {encoding: 'utf8'});
}

const writeFile = async (fName, fContent) => {
    fs.writeFile(fName, fContent,  {'flag':'a'},  function(err) {
        if (err) {
            return console.error(err);
        }
    });
}

const wallet_file = await readFile('./wallet/wallet-nft.json');
const wallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(wallet_file)));
console.log('=====> wallet PublicKey:', wallet.publicKey.toBase58())

const connection = new Connection(clusterApiUrl("devnet"));
const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    // .use(bundlrStorage());
    .use(bundlrStorage({
        address: 'https://devnet.bundlr.network',
        providerUrl: 'https://api.devnet.solana.com',
        timeout: 60000,
    }));



const uploadMetadata = async(metaplex, img) => {
    const { uri } = await metaplex.nfts().uploadMetadata({
        name: "NFT july 28 12:27AM",
        Symbol: "MN",
        description: "My description of the metaplex nfts file",
        image: img,
    });
    
    console.log('=====> metadata link: ', uri, '\n\n');
    return uri;
}



async function main(){
    const inputData = await JSON.parse( await readFile('./files/input.json'));

    for (let i in inputData){
        // const link = `https://${i}.com`;
        const link = inputData[i]
        try{
            const { nft } = await metaplex.nfts().create({
                uri: link,
                isMutable: false,
                maxSupply: 0,
                // sellerFeeBasisPoints: 1500,
            });
            writeFile('./files/result-success.txt', `${i}: ${link},\n`);
            writeFile('./files/result-nft-details.json', `"${i}": ${JSON.stringify(nft)},\n\n`);
            console.log(i, ': success.')
        } catch(e){
            writeFile('./files/result-fail.txt', `${i},`);
            writeFile('./files/result-error.txt', `${i}: ${e} \n\n`);
            console.log(i, ': fail.')
        }
    }    
}

main();





// uploadMetadata(metaplex, 'https://arweave.net/vY4FcJFaQCPU1KjaacFDQ31xPCXMWYiTTlbcDTTSll4')
// uploadMetadata(metaplex, 'https://arweave.net/CQkdqKft_dP4qzGMGWuHxdO8I2LmgE7varlNj3Pdrio')
// uploadMetadata(metaplex, 'https://arweave.net/xnkU7n30l798NFltkAvUhQoztpStt_8wwiss1M2mOlM')












