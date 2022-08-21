
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

module.exports =(app)=> {
    app.post("/getCreatedDAOMember",async(req,res)=>{

        const {identity} = req.body

        try{
            const allDAO = await contract.getCreatedDAOMember(identity)
            const _allDAO = []
            // const result = await transaction.wait()
            allDAO.forEach(array => {
                _allDAO.push(array.toString())
            })
            // console.log(JSON.stringify({"DAO":_allDAO}))
    
            res.status(200).send({"DAO":_allDAO}).end()
    
        }catch(error){
            // console.error(error)
    
            res.status(500).end()
        }

    }),
    app.post("/getJoinedDAOMember",async(req,res)=>{

        const {identity} = req.body

        try{
            const allDAO = await contract.getJoinedDAOMember(identity)
            const _allDAO = []
            // const result = await transaction.wait()
            allDAO.forEach(array => {
                _allDAO.push(array.toString())
            })
            // console.log(JSON.stringify({"DAO":_allDAO}))
    
            res.status(200).send({"DAO":_allDAO}).end()
    
        }catch(error){
            // console.error(error)
    
            res.status(500).end()
        }

    }),
    app.post("/getGroup",async(req,res)=>{

        const {groupIdentity} = req.body

        try{
            const DAO = await contract.getGroup(groupIdentity)
            // console.log(DAO.CID)
            res.status(200).send({"DAO_CID":DAO.CID,
            "DAORole":DAO.role.toString(),
            "DAOChannel":DAO.channelID.toString(),
            "DAOName": DAO.name,
            "DAORoot":DAO.root.toString()}).end()
    
        }catch(error){
            // console.error(error)
    
            res.status(500).end()
        }

    })
    app.post("/getMemberToGroup", async(req,res) => {
        const {groupIdentity} = req.body
        try{
            const allIdentity = await contract.getMemberToGroup(groupIdentity)
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

}