const cors = require("cors")
const dotenv = require("dotenv")
const ether  =  require("ethers")
const express = require("express")
const router = express.Router()
const path =  require("path")
const { send } = require("process")
const PolyZKVote =  require("./abi/PolyZKVote.json")

dotenv.config({ path: path.resolve(__dirname, "./.env") })

if (typeof process.env.CONTRACT_ADDRESS !== "string") {
    throw new Error("Please, define CONTRACT_ADDRESS in your .env file")
}

if (typeof process.env.NETWORK_URL !== "string") {
    throw new Error("Please, define NETWORK_URL in your .env file")
}

if (typeof process.env.WALLET_PRIVATE_KEY !== "string") {
    throw new Error("Please, define WALLET_PRIVATE_KEY in your .env file")
}

if (typeof process.env.RELAY_URL !== "string") {
    throw new Error("Please, define RELAY_URL in your .env file")
}

const WalletPrivateKey = process.env.WALLET_PRIVATE_KEY
const NetworkURL = process.env.NETWORK_URL
const contractAddress = process.env.CONTRACT_ADDRESS
const { port } = new URL(process.env.RELAY_URL)

const app = express()

app.use(cors())
app.use(express.json())
app.use(router)
require('./DAO/dao')(router)
require('./Proposal/proposal')(router)

const provider = new ether.providers.JsonRpcProvider(NetworkURL)
const signer = new ether.Wallet(WalletPrivateKey, provider)
const contract = new ether.Contract(contractAddress,PolyZKVote.abi, signer)

// Function to estimate max fee and max priority fee
const calcFeeData = async (
    maxFeePerGas = undefined,
    maxPriorityFeePerGas = undefined
  ) => {
    const baseFee = parseInt(await (await signer.provider.getFeeData()).lastBaseFeePerGas, 16) / 1e9
    maxPriorityFeePerGas =
      maxPriorityFeePerGas == undefined
        ? parseInt(await (await signer.provider.getFeeData()).maxPriorityFeePerGas, 16) / 1e9
        : maxPriorityFeePerGas
    maxFeePerGas =
      maxFeePerGas == undefined ? baseFee + maxPriorityFeePerGas : maxFeePerGas
  
    if (maxFeePerGas < maxPriorityFeePerGas) {
      throw "Error: Max fee per gas cannot be less than max priority fee per gas"
    }
  
    return {
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    }
  }

app.get("/getIdentity", async(req,res) => {
    try{
        const allIdentity = await contract.getIdentity()
        const _identity = []
        // const result = await transaction.wait()
        allIdentity.forEach(array => {
            _identity.push(array.toString())
        })
        // console.log(JSON.stringify({"identity":_identity}))

        res.status(200).send({"identity":_identity}).end()

    }catch(error){
        // console.error(error)

        res.status(500).end()
    }
})

app.post("/updateGroup", async (req,res) => {
    try {
        const {provider,name,root,channelID,depth,CID,groupId,identity,role,type} = req.body
        // console.log(req.body)
        var channelName = name
        var maxFeePerGas ,maxPriorityFeePerGas
        ({ maxFeePerGas, maxPriorityFeePerGas } = await calcFeeData(maxFeePerGas,maxPriorityFeePerGas))
        maxFeePerGas = ether.utils.parseUnits(maxFeePerGas, "gwei")
        maxPriorityFeePerGas = ether.utils.parseUnits(maxPriorityFeePerGas, "gwei")
        // console.log(maxFeePerGas,maxPriorityFeePerGas)
        if(type === true){
            channelName = ether.utils.formatBytes32String(name)
        }
        if(groupId === 1){
            channelName = ether.utils.formatBytes32String(name)
        }
        const _group = {
            provider:ether.utils.formatBytes32String(provider),
            name:channelName,
            root:root,
            channelID:channelID,
            depth:depth,
            CID:CID,
            role:role}
        const transaction = await contract.updateGroup(_group,groupId,identity,type,{
            type:2,
            maxPriorityFeePerGas,
            maxFeePerGas
        })
        // console.log(transaction) 
        const result = await transaction.wait()  
        // console.log(result)
        res.status(200).send({"result":"Success","error":''}).end()
        
    } catch (error) {
        console.error(error)

        res.status(500).send({"result":"Failed","error":error.toString()}).end()
    }
})



app.listen(port, () => {
    console.info(`Started HTTP relay API at ${process.env.RELAY_URL}/`)
})