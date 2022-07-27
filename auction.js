import { Connection, programs } from "@metaplex/js";
import { clusterApiUrl, Keypair, PublicKey} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

const {
  metaplex: { Store, AuctionManager },
  metadata: { Metadata },
  auction: { Auction },
  vault: { Vault },
} = programs;

import wallet_file from './wallet.json' ;//assert {type: "json"};
const wallet = new anchor.Wallet(Keypair.fromSecretKey(Uint8Array.from(wallet_file)));


const connection = new Connection("devnet");
const balance = await connection.getBalance(wallet.publicKey);
console.log("\n=====> balance: ", balance, '\n\n');


// // Auction
const auction = await Auction.load(connection, wallet.publicKey.toBase58());
console.log("=====> auction: ", auction);

// // Init store
// const { storeId } = await auction.initStore({
//     connection,
//     wallet,
//   });

// // Metadata
// const metadata = await Metadata.load(connection, "<pubkey>");

// // Vault
// const vault = await Vault.load(connection, "<pubkey>");
// // Metaplex
// const auctionManager = await AuctionManager.load(connection, "<pubkey>");
// const store = await Store.load(connection, "<pubkey>");