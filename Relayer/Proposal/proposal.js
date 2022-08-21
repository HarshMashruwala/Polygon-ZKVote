const dotenv = require("dotenv")
const ether  =  require("ethers")
const path =  require("path")
const PolyZKVote =  require("../abi/PolyZKVote.json")

dotenv.config({ path: path.resolve(__dirname, "./.env") })

const WalletPrivateKey = process.env.WALLET_PRIVATE_KEY
const NetworkURL = process.env.NETWORK_URL
const contractAddress = process.env.CONTRACT_ADDRESS

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


module.exports =(app)=> {
    app.post("/getGroupProposal",async(req,res)=>{

        const {groupIdentity} = req.body

        try{
            const allProposal = await contract.getGroupProposal(groupIdentity)
            const _allProposal = []
            // const result = await transaction.wait()
            allProposal.forEach(array => {
                _allProposal.push(array.toString())
            })
            // console.log(JSON.stringify({"Proposal":_allProposal}))
    
            res.status(200).send({"Proposal":_allProposal}).end()
    
        }catch(error){
            // console.error(error)
    
            res.status(500).end()
        }

    }),
    app.post("/getProposal",async(req,res)=>{

        const {groupIdentity,proposalIdentity} = req.body

        try{
            const Proposal = await contract.getProposal(groupIdentity,proposalIdentity)
            // console.log(Proposal)
            const voterAddedStatus = await contract.addedVoterStatus(proposalIdentity)
            // console.log(voterAddedStatus)
            const _proposal = {
                "CID":Proposal.CID,
                "state":Proposal.state,
                "voterStatus":voterAddedStatus
            }
    
            res.status(200).send({"Proposal":_proposal}).end()
    
        }catch(error){
            // console.error(error)
    
            res.status(500).end()
        }

    }),
    app.post("/getVote",async(req,res)=>{

        const {groupIdentity,proposalIdentity} = req.body

        try{
            const totalVote = await contract.getVote(groupIdentity,proposalIdentity)
    
            res.status(200).send({"TotalVote":totalVote.toString()}).end()
    
        }catch(error){
            // console.error(error)
    
            res.status(500).end()
        }

    }),
    app.post("/castVote",async(req,res)=>{

        const {vote,identity,nullifierHash,pollId,groupId,proof} = req.body
        var maxFeePerGas ,maxPriorityFeePerGas
        ({ maxFeePerGas, maxPriorityFeePerGas } = await calcFeeData(maxFeePerGas,maxPriorityFeePerGas))
        maxFeePerGas = ether.utils.parseUnits(maxFeePerGas, "gwei")
        maxPriorityFeePerGas = ether.utils.parseUnits(maxPriorityFeePerGas, "gwei")
        // console.log(maxFeePerGas,maxPriorityFeePerGas)

        try{
            const totalVote = await contract.castVote(vote,identity,nullifierHash,pollId,groupId,proof,{
                type:2,
                maxPriorityFeePerGas,
                maxFeePerGas
            })
            // console.log(totalVote)
            const result = totalVote.wait()
            // console.log(result)
            res.status(200).send({"result":"Success","error":''}).end()
    
        }catch(error){
            // console.log(JSON.parse(JSON.stringify(error)))
            var reason = JSON.parse(JSON.stringify(error))
            reason = JSON.parse(reason.error.error.body)
            
            // console.error(error.toString().split("execution reverted: "))
    
            res.status(500).send({"result":"Failed.","error":"Opps!Something went wrong. Error: "+reason.error.message}).end()
        }

    }),
    app.post("/addedVoterStatus",async(req,res)=>{

        const {proposalId} = req.body
        try{
            const status = await contract.addedVoterStatus(proposalId)
            // console.log(status)
            res.status(200).send({"result":status}).end()
    
        }catch(error){
            // console.error(error)
    
            res.status(500).send({"result":"Failed.","error":error.toString()}).end()
        }

    })

}