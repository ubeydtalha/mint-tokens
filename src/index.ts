import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import * as token from "@solana/spl-token"

import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  
} from "@metaplex-foundation/js"

import { 
  DataV2,
  createCreateMetadataAccountV2Instruction,
  createUpdateMetadataAccountV2Instruction,
 } from "@metaplex-foundation/mpl-token-metadata"


import * as fs from "fs"
import { findMetadataPda } from "@metaplex-foundation/js/dist/types/plugins"


async function createNewMint(
  connection: web3.Connection,
  payer: web3.Keypair,
  mintAuthority: web3.PublicKey,
  freezeAuthority: web3.PublicKey | null,
  decimals: number,
): Promise<web3.PublicKey> {

  const tokenMint = await token.createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    decimals,
  );

  console.log("Token mint created:", tokenMint);
  console.log(
    `Token Mint: https://explorer.solana.com/address/${tokenMint}?cluster=devnet`
  );

  return tokenMint;

}


async function createTokenAccount(
  connection: web3.Connection,
  payer: web3.Keypair,
  mint: web3.PublicKey,
  owner: web3.PublicKey
) {

  try {
    
    const tokenAccount = await token.getTokenAccountInfo(
      connection,
      owner
    )
    console.log("Token account found:", tokenAccount);
    return tokenAccount

  } catch (error) {
    
    console.log("Token account not found:", error);

    const tokenAccount = await token.createAssociatedTokenAccount(
      connection,
      payer,
      owner,
      mint
    )

  }

  console.log(
      `Token Account: https://explorer.solana.com/address/${tokenAccount.address}?cluster=devnet`
  )

  return tokenAccount
}
async function mintTokens(
  connection: web3.Connection,
  payer: web3.Keypair,
  mint: web3.PublicKey,
  destination: web3.PublicKey,
  authority: web3.Keypair,
  amount: number,
) {

  const mintInfo = await token.getMint(connection, mint);

  console.log("Mint info:", mintInfo);

  const transactionSignature = await token.mintTo(
    connection,
    payer,
    mint,
    destination,
    authority,
    amount * 10 ** mintInfo.decimals,
  )

  console.log("Transaction signature:", transactionSignature);

  console.log(
    `Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  );



}

async function transferTokens(
  connection: web3.Connection,
  payer: web3.Keypair,
  source: web3.PublicKey,
  destination: web3.PublicKey,
  owner: web3.Keypair,
  amount: number,
  mint: web3.PublicKey,
) {
  
  const mintInfo = await token.getMint(connection, mint);

  console.log("Mint info:", mintInfo);

  const transactionSignature = await token.transfer(
    connection,
    payer,
    source,
    destination,
    owner,
    amount * 10 ** mintInfo.decimals,
  )

  console.log("Transaction signature:", transactionSignature);

  console.log(
    `Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  );

}


async function burnTokens(
  connection: web3.Connection,
  payer: web3.Keypair,
  account : web3.PublicKey,
  mint : web3.PublicKey,
  owner: web3.Keypair,
  amount: number,
) {

  const transactionSignature = await token.burn(
    connection,
    payer,
    account,
    mint,
    owner,
    amount,
  )

  console.log("Transaction signature:", transactionSignature);

  console.log(
    `Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  );


}



async function createTokenMetadata(
  connection: web3.Connection,
  metaplex : Metaplex,
  mint : web3.PublicKey,
  user : web3.Keypair,
  name : string,
  symbol : string,
  description : string,

){

  // file to buffer

  const buffer = fs.readFileSync("assets/lama.png")

  // buffer to metaplex file
  const file = toMetaplexFile(buffer , "lama.png")

   // upload image and get image uri
  const imageUri = await metaplex.storage().upload(file)
  console.log("Image URI:", imageUri);
  

  // upload metadata and get metadata uri (off chain metadata)
  const { uri } = await metaplex.nfts().uploadMetadata({
    name : name,
    description : description,
    image : imageUri,
  })

  // get metadata account address
  const metadataPDA = await metaplex.nfts().pdas().metadata({mint: mint})

  // onchain metadata format
  const tokenMetadata = {
    name : name,
    symbol : symbol,
    uri : uri,
    sellerFeeBasisPoints : 0,
    creators : null,
    collection : null,
    uses : null,
  
  } as DataV2

  // transaction to create metadata account
  const transaction = new web3.Transaction().add(
    createCreateMetadataAccountV2Instruction(
      {
        metadata: metadataPDA,
        mint,
        mintAuthority: user.publicKey,
        payer: user.publicKey,
        updateAuthority: user.publicKey,
      },
      {
        createMetadataAccountArgsV2: {
          data: tokenMetadata,
          isMutable: true,
        }
      }
    )
  )
  
  // send transaction
  const transactionSignature = await connection.sendTransaction(
    transaction,
    [user],
  )

  console.log("Transaction signature:", transactionSignature);

  console.log(
    `Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  );

}

async function updateTokenMetadata(
  connection: web3.Connection,
  metaplex : Metaplex,
  mint : web3.PublicKey,
  user : web3.Keypair,
  name : string,
  symbol : string,
  description : string,
){
  // file to buffer

  const buffer = fs.readFileSync("assets/lama.png")

  // buffer to metaplex file
  const file = toMetaplexFile(buffer , "lama.png")

   // upload image and get image uri
  const imageUri = await metaplex.storage().upload(file)
  console.log("Image URI:", imageUri);
  

  // upload metadata and get metadata uri (off chain metadata)
  const { uri } = await metaplex.nfts().uploadMetadata({
    name : name,
    description : description,
    image : imageUri,
  })

  // get metadata account address
  const metadataPDA = await metaplex.nfts().pdas().metadata({mint: mint})

  // onchain metadata format
  const tokenMetadata = {
    name : name,
    symbol : symbol,
    uri : uri,
    sellerFeeBasisPoints : 0,
    creators : null,
    collection : null,
    uses : null,
  
  } as DataV2

  const transaction = new web3.Transaction().add(
    createUpdateMetadataAccountV2Instruction(
      {
        metadata : metadataPDA,
        updateAuthority : user.publicKey,
      },
      {
        updateMetadataAccountArgsV2 : {
          data : tokenMetadata,
          updateAuthority : user.publicKey,
          primarySaleHappened : true,
          isMutable : true,
        }
      }
    )
  )

}

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  console.log("Connection to cluster established:", connection);
  
  const user = await initializeKeypair(connection)

  const mint = await createNewMint(connection, user, user.publicKey, user.publicKey, 2);

  const tokenAccount = await createTokenAccount(connection, user, mint, user.publicKey);

  await mintTokens(connection, user, mint, tokenAccount.address , user, 100);

  console.log("PublicKey:", user.publicKey.toBase58())

  const receiver = web3.Keypair.generate().publicKey
    
  const receiverTokenAccount = await createTokenAccount(
      connection,
      user,
      mint,
      receiver
  )

  await transferTokens(
    connection,
    user,
    tokenAccount.address,
    receiverTokenAccount.address,
    user,
    50,
    mint
  )
  
  await burnTokens(connection, user, tokenAccount.address, mint, user, 25)
  
  
  const MINT_ADDRESS = "95ahsSaZrYkHKiocMgEoSwA1jtxBiB7iiW14yJKJ4xeY" 
  
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    )
    
  // Calling the token 
  await createTokenMetadata(
    connection,
    metaplex,
    new web3.PublicKey(MINT_ADDRESS),
    user,
    "Rise",
    "RISE",
    "The first Rise in there and start of universe.",
  )
    

}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
